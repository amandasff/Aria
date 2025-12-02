import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const tokenPayload = getUserFromRequest(request)

    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can end practice sessions.',
      }, { status: 401 })
    }

    // Get session with segments to calculate total duration
    const session = await (prisma as any).practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        segments: {
          select: {
            duration: true,
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

    if (session.studentId !== tokenPayload.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to end this session',
      }, { status: 403 })
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Session is already completed',
      }, { status: 400 })
    }

    // Calculate total duration from segments
    const totalDuration = (session.segments as any[]).reduce((acc: number, seg: any) => acc + seg.duration, 0)

    // Update session to completed
    const updatedSession = await (prisma as any).practiceSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        totalDuration,
      },
      include: {
        segments: {
          include: {
            piece: {
              select: {
                id: true,
                name: true,
                composer: true,
              },
            },
          },
          orderBy: {
            recordedAt: 'asc',
          },
        },
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedSession,
      message: 'Practice session completed',
    })
  } catch (error) {
    console.error('End session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

