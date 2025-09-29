import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function PATCH(request: NextRequest) {
  try {
    const { ids, status } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Course IDs array is required' },
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
    if (!Object.values(ArticleStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedCourses = await prisma.course.updateMany({
      where: { 
        id: { in: ids }
      },
      data: { 
        status: status as ArticleStatus,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null
      }
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedCourses.count 
    })
  } catch (error) {
    console.error('Error bulk updating courses:', error)
    return NextResponse.json(
      { error: 'Failed to update courses' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Course IDs array is required' },
        { status: 400 }
      )
    }

    // Delete courses (related data will be cascade deleted)
    const deletedCourses = await prisma.course.deleteMany({
      where: { 
        id: { in: ids }
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedCourses.count 
    })
  } catch (error) {
    console.error('Error bulk deleting courses:', error)
    return NextResponse.json(
      { error: 'Failed to delete courses' },
      { status: 500 }
    )
  }
}