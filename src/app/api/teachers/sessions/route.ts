import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'TEACHER') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only teachers can view all student sessions.',
      }, { status: 401 })
    }

    // Get all students for this teacher
    const students = await prisma.user.findMany({
      where: {
        teacherId: tokenPayload.userId,
      },
      select: {
        id: true,
      },
    })

    const studentIds = students.map(s => s.id)

    if (studentIds.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: [],
      })
    }

    // Get all completed sessions from all students with segments
    const sessions = await (prisma as any).practiceSession.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        status: 'COMPLETED',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to recent 20 sessions
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sessions,
    })
  } catch (error) {
    console.error('Get teacher sessions error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

