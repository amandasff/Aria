import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { put } from '@vercel/blob'
import path from 'path'

const createSegmentSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['PIECE', 'WARMUP', 'TECHNIQUE', 'SIGHTREADING', 'OTHER']),
  pieceId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  audioData: z.string(), // Base64 encoded audio
  fileName: z.string(),
  duration: z.number().int().positive(),
  metronomeBPM: z.number().int().positive().optional().nullable(),
  referenceVideoUrl: z.string().url().optional().nullable(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const tokenPayload = getUserFromRequest(request)

    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can create segments.',
      }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createSegmentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    const { title, type, pieceId, notes, audioData, fileName, duration, metronomeBPM, referenceVideoUrl } = validationResult.data

    // Verify session belongs to student and is active
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: { studentId: true, status: true },
    })

    if (!session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Session not found',
      }, { status: 404 })
    }

    if (session.studentId !== tokenPayload.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to add segments to this session',
      }, { status: 403 })
    }

    // Upload audio file
    let audioUrl: string
    const audioBuffer = Buffer.from(audioData.split(',')[1] || audioData, 'base64')
    const ext = path.extname(fileName) || '.webm'

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Upload to Vercel Blob Storage
      const blob = await put(`audio/segments/${tokenPayload.userId}/${sessionId}/${Date.now()}${ext}`, audioBuffer, {
        access: 'public',
        contentType: `audio/${ext.slice(1)}`,
      })
      audioUrl = blob.url
    } else {
      // For local development, return error (should use blob storage)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Audio storage not configured. Please set up Vercel Blob Storage.',
      }, { status: 500 })
    }

    // Create segment
    const segment = await (prisma as any).practiceSegment.create({
      data: {
        sessionId,
        pieceId: pieceId || null,
        title,
        type,
        notes: notes || null,
        audioUrl,
        duration,
        metronomeBPM: metronomeBPM || null,
        referenceVideoUrl: referenceVideoUrl || null,
        recordedAt: new Date(),
      },
      include: {
        piece: {
          select: {
            id: true,
            name: true,
            composer: true,
          },
        },
      },
    })

    // Update session total duration
    const updatedSession = await (prisma as any).practiceSession.update({
      where: { id: sessionId },
      data: {
        totalDuration: {
          increment: duration,
        },
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: segment,
      message: 'Segment created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create segment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

