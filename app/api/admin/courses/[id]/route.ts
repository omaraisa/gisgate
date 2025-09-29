import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const course = await prisma.course.findUnique({
      where: { id: resolvedParams.id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        enrollments: {
          select: {
            id: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json()

    const updatedCourse = await prisma.course.update({
      where: { id: resolvedParams.id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        category: data.category,
        tags: data.tags,
        price: data.price,
        currency: data.currency,
        isFree: data.isFree,
        isPrivate: data.isPrivate,
        level: data.level,
        language: data.language,
        duration: data.duration,
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