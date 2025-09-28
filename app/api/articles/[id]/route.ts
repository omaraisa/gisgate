import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

// GET /api/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by slug
    let article = await prisma.article.findUnique({
      where: { id: id },
      include: { images: true }
    });

    if (!article) {
      article = await prisma.article.findUnique({
        where: { slug: id },
        include: { images: true }
      });
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

// PUT /api/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, excerpt, featuredImage, category, tags, status } = body;

    const existingArticle = await prisma.article.findUnique({
      where: { id }
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      content,
      excerpt,
      featuredImage,
      category,
      tags: tags ? JSON.stringify(tags) : null,
      status,
      updatedAt: new Date()
    };

    // Only update title and slug if title changed
    if (title && title !== existingArticle.title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      
      // Check if new slug exists
      const slugExists = await prisma.article.findUnique({
        where: { slug: newSlug, NOT: { id } }
      });

      if (slugExists) {
        return NextResponse.json({ error: 'Article with this title already exists' }, { status: 400 });
      }

      updateData.title = title;
      updateData.slug = newSlug;
      updateData.metaTitle = title;
    }

    // Update publishedAt if status changes to PUBLISHED
    if (status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    if (excerpt) {
      updateData.metaDescription = excerpt;
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        images: true
      }
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await prisma.article.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
