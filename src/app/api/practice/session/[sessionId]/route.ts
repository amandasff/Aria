import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const tokenPayload = getUserFromRequest(request)

    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    // Get session with segments
    const session = await (prisma as any).practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherId: true,
          },
        },
        segments: {
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
          orderBy: {
            recordedAt: 'asc',
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

    // Check authorization
    const isStudent = tokenPayload.role === 'STUDENT' && session.studentId === tokenPayload.userId
    const isTeacher = tokenPayload.role === 'TEACHER' && session.student.teacherId === tokenPayload.userId

    if (!isStudent && !isTeacher) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to view this session',
      }, { status: 403 })
    }

    // Calculate total duration from segments if not set
    const calculatedDuration = (session.segments as any[]).reduce((acc: number, seg: any) => acc + seg.duration, 0)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        session: {
          ...session,
          totalDuration: session.totalDuration || calculatedDuration,
        },
        segments: session.segments,
        totalDuration: session.totalDuration || calculatedDuration,
      },
    })
  } catch (error) {
    console.error('Get session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

