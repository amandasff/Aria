import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { analyzePracticeSession } from '@/lib/claude'
import { ApiResponse } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { segmentId: string } }
) {
  try {
    const segmentId = params.segmentId

    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 })
    }

    // Get segment with session
    const segment = await prisma.practiceSegment.findUnique({
      where: { id: segmentId },
      include: {
        session: {
          include: {
            student: {
              select: {
                id: true,
                teacherId: true,
              },
            },
          },
        },
        analysis: true,
      },
    })

    if (!segment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Segment not found',
      }, { status: 404 })
    }

    // Check authorization
    const isStudent = tokenPayload.role === 'STUDENT' && segment.session.studentId === tokenPayload.userId
    const isTeacher = tokenPayload.role === 'TEACHER' && segment.session.student.teacherId === tokenPayload.userId

    if (!isStudent && !isTeacher) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to analyze this segment',
      }, { status: 403 })
    }

    // Check if already analyzed
    if (segment.analysis) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: segment.analysis,
        message: 'Analysis already exists',
      })
    }

    // Analyze the segment with Claude
    const analysisResult = await analyzePracticeSession(
      segment.audioUrl,
      segment.title,
      segment.duration
    )

    // Save analysis to database
    const analysis = await prisma.practiceAnalysis.create({
      data: {
        segmentId: segment.id,
        overallFeedback: analysisResult.overallFeedback,
        piecesIdentified: analysisResult.piecesIdentified ? JSON.stringify(analysisResult.piecesIdentified) : null,
        timeBreakdown: analysisResult.timeBreakdown ? JSON.stringify(analysisResult.timeBreakdown) : null,
        suggestions: analysisResult.suggestions ? JSON.stringify(analysisResult.suggestions) : null,
        strengths: analysisResult.strengths ? JSON.stringify(analysisResult.strengths) : null,
        areasForImprovement: analysisResult.areasForImprovement ? JSON.stringify(analysisResult.areasForImprovement) : null,
        overallScore: analysisResult.overallScore,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: analysis,
      message: 'Analysis completed successfully',
    })
  } catch (error) {
    console.error('Analyze segment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { segmentId: string } }
) {
  try {
    const segmentId = params.segmentId

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
      where: { segmentId },
      include: {
        segment: {
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
    const isStudent = tokenPayload.role === 'STUDENT' && analysis.segment.session.studentId === tokenPayload.userId
    const isTeacher = tokenPayload.role === 'TEACHER' && analysis.segment.session.student.teacherId === tokenPayload.userId

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

