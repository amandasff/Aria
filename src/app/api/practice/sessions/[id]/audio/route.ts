import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Get user from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) {
      return NextResponse.json({
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
      return NextResponse.json({
        success: false,
        error: 'Session not found',
      }, { status: 404 })
    }

    // Check authorization
    const isStudent = tokenPayload.role === 'STUDENT' && session.studentId === tokenPayload.userId
    const isTeacher = tokenPayload.role === 'TEACHER' && session.student.teacherId === tokenPayload.userId

    if (!isStudent && !isTeacher) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized to access this audio',
      }, { status: 403 })
    }

    // Check if file exists
    if (!fs.existsSync(session.audioFilePath)) {
      return NextResponse.json({
        success: false,
        error: 'Audio file not found',
      }, { status: 404 })
    }

    // Read file
    const fileBuffer = fs.readFileSync(session.audioFilePath)

    // Determine content type from file extension
    const ext = path.extname(session.audioFilePath).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.webm': 'audio/webm',
      '.ogg': 'audio/ogg',
    }
    const contentType = contentTypeMap[ext] || 'audio/mpeg'

    // Return audio file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Stream audio error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
