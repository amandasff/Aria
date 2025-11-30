import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'
import fs from 'fs/promises'
import { createReadStream } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    // Get session
    const session = await prisma.practiceSession.findUnique({
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
        analysis: true,
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

    return NextResponse.json<ApiResponse>({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    // Get session
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

    // Check authorization (student can delete own, teacher can delete student's)
    const isStudent = tokenPayload.role === 'STUDENT' && session.studentId === tokenPayload.userId
    const isTeacher = tokenPayload.role === 'TEACHER' && session.student.teacherId === tokenPayload.userId

    if (!isStudent && !isTeacher) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to delete this session',
      }, { status: 403 })
    }

    // Delete audio file
    try {
      await fs.unlink(session.audioFilePath)
    } catch (error) {
      console.error('Error deleting audio file:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete session (cascade will delete analysis)
    await prisma.practiceSession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Session deleted successfully',
    })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
