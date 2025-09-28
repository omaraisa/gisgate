import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

// GET /api/lessons - Get all lessons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PUBLISHED';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    const lessons = await prisma.video.findMany({
      where,
      include: {
        images: true,
        author: {
          select: {
            fullNameArabic: true,
            fullNameEnglish: true,
            email: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.video.count({ where });

    // Format the response to match the expected structure
    const formattedLessons = lessons.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      excerpt: lesson.excerpt,
      featuredImage: lesson.featuredImage,
      category: lesson.category,
      publishedAt: lesson.publishedAt?.toISOString(),
      viewCount: lesson.viewCount,
      authorName: lesson.authorName || lesson.author?.fullNameArabic || lesson.author?.fullNameEnglish || 'مجهول',
      videoUrl: lesson.videoUrl,
      duration: lesson.duration
    }));

    return NextResponse.json({
      lessons: formattedLessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}