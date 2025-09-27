import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'
import slugify from 'slugify'

interface AIArticleRequest {
  article_title: string
  article_excerpt?: string
  content: {
    text: string
    image?: string
  }
  category?: string
  tags?: string
  status?: ArticleStatus
  aiPrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const data: AIArticleRequest = await request.json()

    // Validate required fields
    if (!data.article_title) {
      return NextResponse.json(
        { error: 'article_title is required' },
        { status: 400 }
      )
    }

    if (!data.content || !data.content.text) {
      return NextResponse.json(
        { error: 'content.text is required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = slugify(data.article_title, {
      lower: true,
      strict: true,
      locale: 'ar',
      remove: /[*+~.()'"!:@]/g
    })

    // Check if slug already exists and make it unique
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.article.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // Process the content - the text can contain HTML
    const content = data.content.text

    // Create the article
    const newArticle = await prisma.article.create({
      data: {
        title: data.article_title,
        slug: uniqueSlug,
        excerpt: data.article_excerpt || null,
        content: content,
        featuredImage: data.content.image || null,
        status: data.status || ArticleStatus.DRAFT,
        publishedAt: data.status === ArticleStatus.PUBLISHED ? new Date() : null,
        category: data.category || null,
        tags: data.tags || null,
        aiGenerated: true,
        aiPrompt: data.aiPrompt || null,
        // Set default meta values
        metaTitle: data.article_title.length > 60 ? data.article_title.substring(0, 57) + '...' : data.article_title,
        metaDescription: data.article_excerpt || (content.length > 160 ? content.substring(0, 157) + '...' : content),
      }
    })

    return NextResponse.json({
      success: true,
      article: {
        id: newArticle.id,
        title: newArticle.title,
        slug: newArticle.slug,
        excerpt: newArticle.excerpt,
        content: newArticle.content,
        featuredImage: newArticle.featuredImage,
        status: newArticle.status,
        publishedAt: newArticle.publishedAt,
        category: newArticle.category,
        tags: newArticle.tags,
        aiGenerated: newArticle.aiGenerated,
        createdAt: newArticle.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating AI article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}