import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courses = await prisma.course.findMany({
      include: {
        lessons: {
          select: {
            id: true
          }
        },
        enrollments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Add stats to each course
    const coursesWithStats = courses.map(course => ({
      ...course,
      lessonCount: course.lessons.length,
      enrollmentCount: course.enrollments.length,
      lessons: undefined, // Remove the arrays to keep response clean
      enrollments: undefined
    }))

    return NextResponse.json(coursesWithStats)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Course ID and status are required' },
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

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { 
        status: status as ArticleStatus,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null
      }
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Delete course (related data will be cascade deleted)
    await prisma.course.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}