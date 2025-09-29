import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: {
          where: { 
            status: { in: ['PUBLISHED', 'DRAFT'] }
          },
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            videoUrl: true,
            duration: true,
            order: true,
            images: {
              select: {
                id: true,
                url: true,
                alt: true,
                caption: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Format the response
    const formattedCourse = {
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
      totalLessons: course.lessons.length,
      publishedAt: course.publishedAt?.toISOString(),
      enrollmentCount: course._count.enrollments,
      lessons: course.lessons
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}