import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug: data.slug }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 400 }
      )
    }

    const newArticle = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content || '',
        featuredImage: data.featuredImage || null,
        status: data.status || ArticleStatus.DRAFT,
        publishedAt: data.status === ArticleStatus.PUBLISHED ? new Date() : null,
        category: data.category || null,
        tags: data.tags || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
      }
    })

    return NextResponse.json(newArticle, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}