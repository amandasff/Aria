import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { put } from '@vercel/blob'
import path from 'path'

const feedbackSchema = z.object({
  feedback: z.string().nullable().optional(),
  audioData: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'TEACHER') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only teachers can provide feedback.',
      }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = feedbackSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    const { feedback, audioData, fileName } = validationResult.data

    if (!feedback && !audioData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Please provide either text or audio feedback',
      }, { status: 400 })
    }

    // Get session and verify teacher owns the student
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          select: {
            teacherId: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Session not found',
      }, { status: 404 })
    }

    if (session.student.teacherId !== tokenPayload.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to provide feedback for this session',
      }, { status: 403 })
    }

    let teacherFeedbackAudio: string | null = null

    // Handle audio feedback
    if (audioData && fileName) {
      const audioBuffer = Buffer.from(audioData.split(',')[1] || audioData, 'base64')
      const ext = path.extname(fileName) || '.webm'
      const blobFileName = `audio/feedback/${sessionId}/teacher-feedback${ext}`

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        // Upload to Vercel Blob Storage
        const blob = await put(blobFileName, audioBuffer, {
          access: 'public',
          contentType: `audio/${ext.slice(1)}`,
        })
        teacherFeedbackAudio = blob.url
      } else {
        // For local development, we could save to filesystem, but for now just return error
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Audio storage not configured. Please set up Vercel Blob Storage.',
        }, { status: 500 })
      }
    }

    // Update session with feedback
    const updatedSession = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        teacherFeedback: feedback || null,
        teacherFeedbackAudio: teacherFeedbackAudio,
        teacherFeedbackAt: new Date(),
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
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedSession,
      message: 'Feedback saved successfully',
    })
  } catch (error) {
    console.error('Save feedback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

