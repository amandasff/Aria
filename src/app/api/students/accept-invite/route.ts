import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { ApiResponse, AuthResponse } from '@/types'

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = acceptInviteSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    const { token, password } = validationResult.data

    // Find user with this invite token
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired invite token',
      }, { status: 400 })
    }

    // Check if invite has expired
    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'This invite has expired. Please request a new one from your teacher.',
      }, { status: 400 })
    }

    // Check if user already has a password (already accepted)
    if (user.password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'This invite has already been accepted. Please login instead.',
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Update user with password and clear invite token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        inviteToken: null,
        inviteExpiresAt: null,
      },
    })

    // Generate JWT token
    const jwtToken = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    })

    // Create response
    const response = NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
        token: jwtToken,
      },
      message: 'Account activated successfully',
    })

    // Set HTTP-only cookie
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
