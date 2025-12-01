import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Token is required',
      }, { status: 400 })
    }

    // Find user with this invite token
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: {
        name: true,
        email: true,
        inviteExpiresAt: true,
        password: true, // Check if already accepted
      },
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid invite token',
      }, { status: 400 })
    }

    // Check if invite has expired
    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'This invite has expired',
      }, { status: 400 })
    }

    // Check if already accepted
    if (user.password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'This invite has already been accepted',
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Invite info error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

