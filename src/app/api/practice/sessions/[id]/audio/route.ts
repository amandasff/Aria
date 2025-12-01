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

    // Check if audioFilePath is a URL (Blob Storage) or local path
    if (session.audioFilePath.startsWith('http://') || session.audioFilePath.startsWith('https://')) {
      // It's a Blob Storage URL - redirect to it or proxy it
      const response = await fetch(session.audioFilePath)
      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: 'Audio file not found',
        }, { status: 404 })
      }
      
      const audioBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'audio/webm'
      
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': audioBuffer.byteLength.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } else {
      // It's a local filesystem path
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
    }
  } catch (error) {
    console.error('Stream audio error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
