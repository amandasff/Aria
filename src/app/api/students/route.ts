import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'TEACHER') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only teachers can view students.',
      }, { status: 401 })
    }

    // Get all students for this teacher
    const students = await prisma.user.findMany({
      where: {
        teacherId: tokenPayload.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        inviteToken: true, // Include to show pending invites
        _count: {
          select: {
            practiceSessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: students,
    })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'TEACHER') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('id')

    if (!studentId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student ID is required',
      }, { status: 400 })
    }

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

    // Delete student (cascade will delete their practice sessions)
    await prisma.user.delete({
      where: { id: studentId },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Student removed successfully',
    })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
