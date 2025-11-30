import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { analyzePracticeSession } from '@/lib/claude'
import { ApiResponse } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

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
        error: 'Unauthorized to analyze this session',
      }, { status: 403 })
    }

    // Check if already analyzed
    if (session.analysis) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: session.analysis,
        message: 'Analysis already exists',
      })
    }

    // Analyze the session with Claude
    const analysisResult = await analyzePracticeSession(
      session.audioFilePath,
      session.title,
      session.duration
    )

    // Save analysis to database (stringify JSON for SQLite)
    const analysis = await prisma.practiceAnalysis.create({
      data: {
        sessionId: session.id,
        overallFeedback: analysisResult.overallFeedback,
        piecesIdentified: JSON.stringify(analysisResult.piecesIdentified),
        timeBreakdown: JSON.stringify(analysisResult.timeBreakdown),
        suggestions: JSON.stringify(analysisResult.suggestions),
        strengths: JSON.stringify(analysisResult.strengths),
        areasForImprovement: JSON.stringify(analysisResult.areasForImprovement),
        overallScore: analysisResult.overallScore,
      },
    })

    // Update session status
    await prisma.practiceSession.update({
      where: { id: sessionId },
      data: { status: 'ANALYZED' },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: analysis,
      message: 'Analysis completed successfully',
    })
  } catch (error) {
    console.error('Analyze session error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to analyze session. Please try again.',
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    // Get analysis
    const analysis = await prisma.practiceAnalysis.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            student: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      },
    })

    if (!analysis) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Analysis not found',
      }, { status: 404 })
    }

    // Check authorization
    const isStudent = tokenPayload.role === 'STUDENT' && analysis.session.studentId === tokenPayload.userId
    const isTeacher = tokenPayload.role === 'TEACHER' && analysis.session.student.teacherId === tokenPayload.userId

    if (!isStudent && !isTeacher) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to view this analysis',
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: analysis,
    })
  } catch (error) {
    console.error('Get analysis error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
