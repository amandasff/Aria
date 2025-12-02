import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can start practice sessions.',
      }, { status: 401 })
    }

    // Check if student already has an active session
    const activeSession = await (prisma as any).practiceSession.findFirst({
      where: {
        studentId: tokenPayload.userId,
        status: 'ACTIVE',
      },
    })

    if (activeSession) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { sessionId: activeSession.id },
        message: 'Active session found',
      })
    }

    // Create new active session
    const session = await (prisma as any).practiceSession.create({
      data: {
        studentId: tokenPayload.userId,
        status: 'ACTIVE',
        totalDuration: 0,
        date: new Date(),
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { sessionId: session.id },
      message: 'Practice session started',
    }, { status: 201 })
  } catch (error) {
    console.error('Start practice session error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

