import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/lib/api-auth'
import { ArticleStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;
    const lessonId = params.lessonId;

    const lesson = await prisma.video.findFirst({
      where: {
        id: lessonId,
        courseId: courseId
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching course lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course lesson' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;
    const lessonId = params.lessonId;
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status,
      category,
      tags,
      metaTitle,
      metaDescription,
      videoUrl,
      duration,
      thumbnail,
      order
    } = body;

    // Check if slug is unique (excluding current lesson)
    if (slug) {
      const existingLesson = await prisma.video.findFirst({
        where: {
          slug,
          id: { not: lessonId }
        }
      });

      if (existingLesson) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    const updatedLesson = await prisma.video.update({
      where: {
        id: lessonId,
        courseId: courseId
      },
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        status: status as ArticleStatus,
        category,
        tags,
        metaTitle,
        metaDescription,
        videoUrl,
        duration,
        thumbnail,
        order: order || 0,
        publishedAt: status === 'PUBLISHED' ? new Date() : null
      }
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating course lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update course lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const courseId = params.id;
    const lessonId = params.lessonId;

    // Delete lesson
    await prisma.video.delete({
      where: {
        id: lessonId,
        courseId: courseId
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
    console.error('Error deleting course lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete course lesson' },
      { status: 500 }
    );
  }
}