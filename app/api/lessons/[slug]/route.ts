import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      include: {
        images: true,
        author: {
          select: {
            fullNameArabic: true,
            fullNameEnglish: true,
            email: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Format the response
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      excerpt: lesson.excerpt,
      featuredImage: lesson.featuredImage,
      category: lesson.category,
      tags: lesson.tags,
      publishedAt: lesson.publishedAt?.toISOString(),
      viewCount: lesson.viewCount,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      authorName: lesson.authorName || lesson.author?.fullNameArabic || lesson.author?.fullNameEnglish || 'مجهول',
      images: lesson.images
    };

    return NextResponse.json(formattedLesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}