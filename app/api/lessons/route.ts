import { NextRequest } from 'next/server';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { successResponse, handleApiError } from '@/lib/api-utils';

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

    const lessons = await prisma.lesson.findMany({
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

    const total = await prisma.lesson.count({ where });

    // Format the response to match the expected structure
    const formattedLessons = lessons.map((lesson: Prisma.LessonGetPayload<{ include: { author: { select: { fullNameArabic: true, fullNameEnglish: true, email: true } } } }>) => ({
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

    return successResponse({
      lessons: formattedLessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}