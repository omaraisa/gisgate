import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { ids, status } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Lesson IDs array is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedLessons = await prisma.video.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status: status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      updatedCount: updatedLessons.count
    })
  } catch (error) {
    console.error('Error bulk updating lessons:', error)
    return NextResponse.json(
      { error: 'Failed to update lessons' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Lesson IDs array is required' },
        { status: 400 }
      )
    }

    // Delete lessons (images will be cascade deleted)
    const deletedLessons = await prisma.video.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deletedLessons.count
    })
  } catch (error) {
    console.error('Error bulk deleting lessons:', error)
    return NextResponse.json(
      { error: 'Failed to delete lessons' },
      { status: 500 }
    )
  }
}