import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    let studentId = tokenPayload.userId

    // If teacher, check for studentId query param
    if (tokenPayload.role === 'TEACHER') {
      const { searchParams } = new URL(request.url)
      const requestedStudentId = searchParams.get('studentId')
      if (requestedStudentId) {
        // Verify student belongs to this teacher
        const student = await prisma.user.findFirst({
          where: {
            id: requestedStudentId,
            teacherId: tokenPayload.userId,
          },
        })
        if (student) {
          studentId = requestedStudentId
        }
      }
    }

    // Get all sessions for this student, ordered by date
    const sessions = await prisma.practiceSession.findMany({
      where: { studentId },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate streak
    let streak = 0
    if (sessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Check if there's a session today or yesterday
      const hasRecentSession = sessions.some(session => {
        const sessionDate = new Date(session.createdAt)
        sessionDate.setHours(0, 0, 0, 0)
        return sessionDate.getTime() === today.getTime() || sessionDate.getTime() === yesterday.getTime()
      })

      if (hasRecentSession) {
        // Group sessions by date
        const sessionsByDate = new Map<string, boolean>()
        sessions.forEach(session => {
          const date = new Date(session.createdAt)
          date.setHours(0, 0, 0, 0)
          const dateKey = date.toISOString().split('T')[0]
          sessionsByDate.set(dateKey, true)
        })

        // Calculate consecutive days
        const dates = Array.from(sessionsByDate.keys()).sort().reverse()
        
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
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        streak,
        totalSessions: sessions.length,
      },
    })
  } catch (error) {
    console.error('Get streak error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

