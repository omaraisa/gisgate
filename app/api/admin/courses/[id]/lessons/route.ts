import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'

interface LessonWithStats {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  videoUrl: string | null;
  duration: string | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  authorName: string | null;
  images: Array<{ id: string }>;
  author: {
    fullNameArabic: string | null;
    fullNameEnglish: string | null;
    email: string;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;

    const lessons = await prisma.video.findMany({
      where: {
        courseId: courseId
      },
      include: {
        images: {
          select: {
            id: true
          }
        },
        author: {
          select: {
            fullNameArabic: true,
            fullNameEnglish: true,
            email: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Add image count to each lesson
    const lessonsWithStats = lessons.map((lesson: LessonWithStats) => ({
      ...lesson,
      imageCount: lesson.images.length,
      authorName: lesson.authorName || lesson.author?.fullNameArabic || lesson.author?.fullNameEnglish || 'مجهول',
      images: undefined // Remove the images array to keep response clean
    }))

    return NextResponse.json(lessonsWithStats)
  } catch (error) {
    console.error('Error fetching course lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course lessons' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;
    const body = await request.json();
    const { title, slug, excerpt, content, videoUrl, duration, status, order } = body;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const lesson = await prisma.video.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        videoUrl,
        duration,
        status: status || 'DRAFT',
        courseId,
        order: order || 0,
        authorId: course.authorId,
        authorName: course.authorName
      }
    });

    // Update course lesson count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        totalLessons: {
          increment: 1
        }
      }
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;
    const { lessonId, status, order } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.publishedAt = status === 'PUBLISHED' ? new Date() : null;
    }
    if (order !== undefined) {
      updateData.order = order;
    }

    const updatedLesson = await prisma.video.update({
      where: { 
        id: lessonId,
        courseId: courseId // Ensure it belongs to this course
      },
      data: updateData
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Delete lesson
    await prisma.video.delete({
      where: { 
        id: lessonId,
        courseId: courseId // Ensure it belongs to this course
      }
    });

    // Update course lesson count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        totalLessons: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}