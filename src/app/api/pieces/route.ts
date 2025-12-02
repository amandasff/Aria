import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

const createPieceSchema = z.object({
  name: z.string().min(1),
  composer: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  targetBPM: z.number().int().positive().optional().nullable(),
  defaultReferenceVideoUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const updatePieceSchema = createPieceSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can view pieces.',
      }, { status: 401 })
    }

    const pieces = await (prisma as any).piece.findMany({
      where: { studentId: tokenPayload.userId },
      orderBy: {
        dateStarted: 'desc',
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: pieces,
    })
  } catch (error) {
    console.error('Get pieces error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can create pieces.',
      }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createPieceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    const piece = await (prisma as any).piece.create({
      data: {
        studentId: tokenPayload.userId,
        ...validationResult.data,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: piece,
      message: 'Piece created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create piece error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can update pieces.',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pieceId = searchParams.get('id')

    if (!pieceId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Piece ID is required',
      }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = updatePieceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validationResult.error.errors[0].message,
      }, { status: 400 })
    }

    // Verify piece belongs to student
    const existingPiece = await (prisma as any).piece.findUnique({
      where: { id: pieceId },
      select: { studentId: true },
    })

    if (!existingPiece) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Piece not found',
      }, { status: 404 })
    }

    if (existingPiece.studentId !== tokenPayload.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to update this piece',
      }, { status: 403 })
    }

    const piece = await (prisma as any).piece.update({
      where: { id: pieceId },
      data: validationResult.data,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: piece,
      message: 'Piece updated successfully',
    })
  } catch (error) {
    console.error('Update piece error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload || tokenPayload.role !== 'STUDENT') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized. Only students can delete pieces.',
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pieceId = searchParams.get('id')

    if (!pieceId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Piece ID is required',
      }, { status: 400 })
    }

    // Verify piece belongs to student
    const existingPiece = await (prisma as any).piece.findUnique({
      where: { id: pieceId },
      select: { studentId: true },
    })

    if (!existingPiece) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Piece not found',
      }, { status: 404 })
    }

    if (existingPiece.studentId !== tokenPayload.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized to delete this piece',
      }, { status: 403 })
    }

    await (prisma as any).piece.delete({
      where: { id: pieceId },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Piece deleted successfully',
    })
  } catch (error) {
    console.error('Delete piece error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${errorMessage}` 
        : 'Internal server error. Please try again.',
    }, { status: 500 })
  }
}

