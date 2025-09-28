import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const lessons = await prisma.video.findMany({
      include: {
        images: {
          select: {
            id: true
          }
        },
        author: {
          select: {
            fullNameArabic: true,
            fullNameEnglish: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Add image count to each lesson
    const lessonsWithStats = lessons.map((lesson: any) => ({
      ...lesson,
      imageCount: lesson.images.length,
      authorName: lesson.authorName || lesson.author?.fullNameArabic || lesson.author?.fullNameEnglish || 'مجهول',
      images: undefined // Remove the images array to keep response clean
    }))

    return NextResponse.json(lessonsWithStats)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Lesson ID and status are required' },
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

    const updatedLesson = await prisma.video.update({
      where: { id },
      data: {
        status: status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null
      }
    })

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    // Delete lesson (images will be cascade deleted)
    await prisma.video.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}