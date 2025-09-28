import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
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

    // Check if slug is unique
    if (slug) {
      const existingLesson = await prisma.video.findUnique({
        where: { slug }
      })

      if (existingLesson) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    const newLesson = await prisma.video.create({
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
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null
      }
    })

    return NextResponse.json(newLesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}