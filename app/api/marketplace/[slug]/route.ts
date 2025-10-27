import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/marketplace/[slug] - Get single solution by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const solution = await prisma.solution.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            fullNameArabic: true,
            fullNameEnglish: true,
            email: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullNameArabic: true,
                fullNameEnglish: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.solution.update({
      where: { id: solution.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(solution);
  } catch (error) {
    console.error('Error fetching solution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solution' },
      { status: 500 }
    );
  }
}

// PUT /api/marketplace/[slug] - Update solution (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const solution = await prisma.solution.update({
      where: { slug },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        excerpt: body.excerpt,
        featuredImage: body.featuredImage,
        images: body.images,
        solutionType: body.solutionType,
        category: body.category,
        tags: body.tags,
        price: body.price,
        currency: body.currency,
        isFree: body.isFree,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        fileType: body.fileType,
        demoUrl: body.demoUrl,
        documentationUrl: body.documentationUrl,
        sourceCodeUrl: body.sourceCodeUrl,
        version: body.version,
        compatibility: body.compatibility,
        requirements: body.requirements,
        status: body.status,
        publishedAt: body.status === 'PUBLISHED' && !body.publishedAt ? new Date() : body.publishedAt,
        authorName: body.authorName,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(solution);
  } catch (error) {
    console.error('Error updating solution:', error);
    return NextResponse.json(
      { error: 'Failed to update solution' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/[slug] - Delete solution (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await prisma.solution.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Solution deleted successfully' });
  } catch (error) {
    console.error('Error deleting solution:', error);
    return NextResponse.json(
      { error: 'Failed to delete solution' },
      { status: 500 }
    );
  }
}
