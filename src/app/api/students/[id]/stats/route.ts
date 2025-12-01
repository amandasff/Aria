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
    // Explicitly select fields to avoid issues if migration hasn't run yet
    const sessions = await prisma.practiceSession.findMany({
      where: { studentId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        createdAt: true,
        status: true,
        audioFilePath: true,
        audioFileSize: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        analysis: true,
        // These fields may not exist if migration hasn't run - Prisma will handle gracefully
        teacherFeedback: true,
        teacherFeedbackAudio: true,
        teacherFeedbackAt: true,
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
  } catch (error: any) {
    console.error('Get student stats error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a Prisma error about missing columns
    if (error?.code === 'P2021' || error?.message?.includes('column') || error?.message?.includes('does not exist')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database migration required. Please run: npx prisma migrate deploy',
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please check server logs.',
    }, { status: 500 })
  }
}

