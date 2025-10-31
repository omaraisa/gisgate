import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const articles = await prisma.article.findMany({
      include: {
        images: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Add image count to each article
    const articlesWithStats = articles.map(article => ({
      ...article,
      imageCount: article.images.length,
      images: undefined // Remove the images array to keep response clean
    }))

    return NextResponse.json(articlesWithStats)
  } catch (error) {
    console.error('Error fetching articles:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Admin'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch articles' },
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
        { error: 'Article ID and status are required' },
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

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: { 
        status: status as ArticleStatus,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null
      }
    })

    return NextResponse.json(updatedArticle)
  } catch (error) {
    console.error('Error updating article:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Admin'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update article' },
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
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Delete article (images will be cascade deleted)
    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Admin'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}