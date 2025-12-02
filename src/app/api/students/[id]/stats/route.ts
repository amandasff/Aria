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

    // Get all completed sessions for this student with segments
    const sessions = await (prisma as any).practiceSession.findMany({
      where: { 
        studentId,
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
      orderBy: { date: 'desc' },
    })

    // Calculate stats
    const sessionsArray = sessions as any[]
    const totalSessions = sessionsArray.length
    const totalPracticeTime = sessionsArray.reduce((acc: number, s: any) => acc + (s.totalDuration || 0), 0)
    const totalMinutes = Math.floor(totalPracticeTime / 60)
    const totalSegments = sessionsArray.reduce((acc: number, s: any) => acc + (s.segments?.length || 0), 0)
    const analyzedSegments = sessionsArray.reduce((acc: number, s: any) => acc + (s.segments?.filter((seg: any) => seg.analysis).length || 0), 0)
    const averageSessionDuration = totalSessions > 0 
      ? Math.floor(totalPracticeTime / totalSessions) 
      : 0

    // Get most recent session
    const mostRecentSession = sessionsArray.length > 0 ? sessionsArray[0] : null

    // Calculate practice frequency (sessions per week)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sessionsThisWeek = sessionsArray.filter(
      (s: any) => new Date(s.date) >= oneWeekAgo
    ).length

    // Calculate streak
    let streak = 0
    if (sessionsArray.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Group sessions by date
      const sessionsByDate = new Map<string, boolean>()
      sessionsArray.forEach((session: any) => {
        const date = new Date(session.date)
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
          totalSegments,
          analyzedSegments,
          averageSessionDuration,
          sessionsThisWeek,
          streak,
        },
        sessions: sessionsArray.map((s: any) => ({
          id: s.id,
          date: s.date,
          totalDuration: s.totalDuration,
          status: s.status,
          createdAt: s.createdAt,
          segments: s.segments,
        })),
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

