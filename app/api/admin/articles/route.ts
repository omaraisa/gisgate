import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export async function GET() {
  try {
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
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}