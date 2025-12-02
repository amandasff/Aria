import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { put } from '@vercel/blob'
import path from 'path'

const feedbackSchema = z.object({
  textFeedback: z.string().nullable().optional(),
  audioFeedbackData: z.string().nullable().optional(),
  audioFeedbackFileName: z.string().nullable().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { segmentId: string } }
) {
  try {
    const segmentId = params.segmentId
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

    const { textFeedback, audioFeedbackData, audioFeedbackFileName } = validationResult.data

    // Get segment and verify teacher owns the student
    const segment = await (prisma as any).practiceSegment.findUnique({
      where: { id: segmentId },
      include: {
        session: {
          include: {
            student: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      },
    })

    if (!segment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Segment not found',
      }, { status: 404 })
    }

    if (segment.session.student.teacherId !== tokenPayload.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to provide feedback for this segment',
      }, { status: 403 })
    }

    let teacherFeedbackAudio: string | null = null

    // Handle audio feedback
    if (audioFeedbackData && audioFeedbackFileName) {
      const audioBuffer = Buffer.from(audioFeedbackData.split(',')[1] || audioFeedbackData, 'base64')
      const ext = path.extname(audioFeedbackFileName) || '.webm'
      const blobFileName = `audio/feedback/${segmentId}/teacher-feedback${ext}`

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(blobFileName, audioBuffer, {
          access: 'public',
          contentType: `audio/${ext.slice(1)}`,
        })
        teacherFeedbackAudio = blob.url
      } else {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Audio storage not configured. Please set up Vercel Blob Storage.',
        }, { status: 500 })
      }
    }

    // Update segment with feedback
    const updatedSegment = await (prisma as any).practiceSegment.update({
      where: { id: segmentId },
      data: {
        teacherFeedbackText: textFeedback || null,
        teacherFeedbackAudio: teacherFeedbackAudio,
        teacherFeedbackAt: new Date(),
      },
      include: {
        piece: {
          select: {
            id: true,
            name: true,
            composer: true,
          },
        },
        analysis: true,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedSegment,
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

