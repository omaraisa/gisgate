import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const lesson = await prisma.video.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()

    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status,
      category,
      tags,
      metaTitle,
      metaDescription,
      videoUrl,
      duration,
      thumbnail
    } = body

    // Check if slug is unique (excluding current lesson)
    if (slug) {
      const existingLesson = await prisma.video.findFirst({
        where: {
          slug: slug,
          id: { not: resolvedParams.id }
        }
      })

      if (existingLesson) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    const updatedLesson = await prisma.video.update({
      where: { id: resolvedParams.id },
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        status: status as ArticleStatus,
        category,
        tags,
        metaTitle,
        metaDescription,
        videoUrl,
        duration,
        thumbnail,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params

    await prisma.video.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}