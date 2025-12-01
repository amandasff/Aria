import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest, generateInviteToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Get teacher from token
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'TEACHER') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only teachers can invite students.',
      }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = inviteSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    const { email, name } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'A user with this email already exists',
      }, { status: 400 })
    }

    // Generate invite token
    const inviteToken = generateInviteToken()
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create student account with invite token (no password yet)
    const student = await prisma.user.create({
      data: {
        email,
        name,
        role: 'STUDENT',
        teacherId: tokenPayload.userId,
        inviteToken,
        inviteExpiresAt,
        password: '', // Will be set when student accepts invite
      },
    })

    // Generate invite URL - use request origin or fallback to env var
    const origin = request.headers.get('origin') || request.nextUrl.origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
    const inviteUrl = `${appUrl}/invite/${inviteToken}`

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        student: {
          id: student.id,
          email: student.email,
          name: student.name,
        },
        inviteUrl,
        inviteToken,
      },
      message: 'Student invited successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Invite student error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
