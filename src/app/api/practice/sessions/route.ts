import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { put } from '@vercel/blob'
import fs from 'fs/promises'
import path from 'path'

const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 second'),
  audioData: z.string(), // Base64 encoded audio
  fileName: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can create practice sessions.',
      }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    const { title, description, duration, audioData, fileName } = validationResult.data

    // Create session first to get ID
    const session = await prisma.practiceSession.create({
      data: {
        studentId: tokenPayload.userId,
        title,
        description,
        duration,
        audioFilePath: '', // Will update after saving file
        status: 'COMPLETED',
      },
    })

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData.split(',')[1] || audioData, 'base64')
    const fileSize = audioBuffer.length

    // Determine file extension
    const ext = path.extname(fileName) || '.webm'
    const blobFileName = `audio/${tokenPayload.userId}/${session.id}/recording${ext}`

    let audioFilePath: string
    let audioFileSize: number = fileSize

    // Use Vercel Blob Storage in production, filesystem in development
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Upload to Vercel Blob Storage
      const blob = await put(blobFileName, audioBuffer, {
        access: 'public',
        contentType: `audio/${ext.slice(1)}`,
      })
      audioFilePath = blob.url
    } else {
      // Fallback to filesystem for local development
      const uploadDir = path.join(
        process.cwd(),
        'uploads',
        'audio',
        tokenPayload.userId,
        session.id
      )
      await fs.mkdir(uploadDir, { recursive: true })
      audioFilePath = path.join(uploadDir, `recording${ext}`)
      await fs.writeFile(audioFilePath, audioBuffer)
    }

    // Update session with file path
    const updatedSession = await prisma.practiceSession.update({
      where: { id: session.id },
      data: {
        audioFilePath: audioFilePath,
        audioFileSize: audioFileSize,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedSession,
      message: 'Practice session created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create practice session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    let sessions

    if (tokenPayload.role === 'TEACHER') {
      // Teacher can view sessions for a specific student or all their students
      if (studentId) {
        // Verify student belongs to this teacher
        const student = await prisma.user.findFirst({
          where: {
            id: studentId,
            teacherId: tokenPayload.userId,
          },
        })

        if (!student) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Student not found or unauthorized',
          }, { status: 404 })
        }

        sessions = await prisma.practiceSession.findMany({
          where: { studentId },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            analysis: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      } else {
        // Get sessions for all students of this teacher
        sessions = await prisma.practiceSession.findMany({
          where: {
            student: {
              teacherId: tokenPayload.userId,
            },
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            analysis: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to recent 50
        })
      }
    } else {
      // Student can only view their own sessions
      sessions = await prisma.practiceSession.findMany({
        where: { studentId: tokenPayload.userId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          analysis: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sessions,
    })
  } catch (error) {
    console.error('Get practice sessions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
