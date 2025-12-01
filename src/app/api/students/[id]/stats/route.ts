import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'TEACHER') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only teachers can view student stats.',
      }, { status: 401 })
    }

    const studentId = params.id

    // Verify student belongs to this teacher
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        teacherId: tokenPayload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    if (!student) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student not found or unauthorized',
      }, { status: 404 })
    }

    // Get all sessions for this student
    const sessions = await prisma.practiceSession.findMany({
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

    // Calculate stats
    const totalSessions = sessions.length
    const totalPracticeTime = sessions.reduce((acc, s) => acc + s.duration, 0)
    const totalMinutes = Math.floor(totalPracticeTime / 60)
    const analyzedSessions = sessions.filter(s => s.analysis).length
    const averageSessionDuration = totalSessions > 0 
      ? Math.floor(totalPracticeTime / totalSessions) 
      : 0

    // Get most recent session
    const mostRecentSession = sessions.length > 0 ? sessions[0] : null

    // Calculate practice frequency (sessions per week)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sessionsThisWeek = sessions.filter(
      s => new Date(s.createdAt) >= oneWeekAgo
    ).length

    // Calculate streak
    let streak = 0
    if (sessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Group sessions by date
      const sessionsByDate = new Map<string, boolean>()
      sessions.forEach(session => {
        const date = new Date(session.createdAt)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split('T')[0]
        sessionsByDate.set(dateKey, true)
      })

      // Start from today or yesterday
      let checkDate = new Date()
      checkDate.setHours(0, 0, 0, 0)
      
      // If no session today, start from yesterday
      const todayKey = checkDate.toISOString().split('T')[0]
      if (!sessionsByDate.has(todayKey)) {
        checkDate.setDate(checkDate.getDate() - 1)
      }

      while (true) {
        const dateKey = checkDate.toISOString().split('T')[0]
        if (sessionsByDate.has(dateKey)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        student,
        stats: {
          totalSessions,
          totalPracticeTime,
          totalMinutes,
          analyzedSessions,
          averageSessionDuration,
          sessionsThisWeek,
          streak,
        },
        sessions,
      },
    })
  } catch (error) {
    console.error('Get student stats error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

