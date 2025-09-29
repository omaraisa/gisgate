import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/courses - Get all published courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      status: 'PUBLISHED'
    };

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        lessons: {
          select: {
            id: true,
            duration: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.course.count({ where });

    // Format the response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      excerpt: course.excerpt,
      featuredImage: course.featuredImage,
      category: course.category,
      level: course.level,
      language: course.language,
      price: course.price,
      currency: course.currency,
      isFree: course.isFree,
      duration: course.duration,
      totalLessons: course.totalLessons,
      publishedAt: course.publishedAt?.toISOString(),
      enrollmentCount: course._count.enrollments,
      lessons: course.lessons
    }));

    return NextResponse.json({
      courses: formattedCourses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}