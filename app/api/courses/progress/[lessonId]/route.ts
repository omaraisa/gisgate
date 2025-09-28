import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../app/lib/prisma';
import { withAuth, getCurrentUser, AuthenticatedRequest } from '../../../../../lib/middleware';

// GET /api/courses/progress/[lessonId] - Get lesson progress
export const GET = withAuth(async (request: AuthenticatedRequest, context) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context?.params;
    const lessonId = params?.lessonId;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      }
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson progress' }, { status: 500 });
  }
}, { requireAuth: true });

// POST /api/courses/progress/[lessonId] - Update lesson progress
export const POST = withAuth(async (request: AuthenticatedRequest, context) => {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context?.params;
    const lessonId = params?.lessonId;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    const { watchedTime, isCompleted } = await request.json();

    // Check if lesson exists and user is enrolled in its course
    const lesson = await prisma.video.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        courseId: true,
        duration: true
      }
    });

    if (!lesson?.courseId) {
      return NextResponse.json({ error: 'Lesson not found or not part of a course' }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.courseId
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Update or create progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        watchedTime: watchedTime !== undefined ? watchedTime : undefined,
        isCompleted: isCompleted !== undefined ? isCompleted : undefined,
        completedAt: isCompleted ? new Date() : undefined,
        lastWatchedAt: new Date()
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        enrollmentId: enrollment.id,
        watchedTime: watchedTime || 0,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : undefined
      }
    });

    // Update course progress if lesson is completed
    if (isCompleted) {
      await updateCourseProgress(enrollment.id, lesson.courseId);
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json({ error: 'Failed to update lesson progress' }, { status: 500 });
  }
}, { requireAuth: true });

// Helper function to update course progress
async function updateCourseProgress(enrollmentId: string, courseId: string) {
  // Get total lessons in course
  const totalLessons = await prisma.video.count({
    where: { courseId: courseId }
  });

  // Get completed lessons for this enrollment
  const completedLessons = await prisma.lessonProgress.count({
    where: {
      enrollmentId: enrollmentId,
      isCompleted: true
    }
  });

  // Calculate progress percentage
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const isCompleted = progress >= 100;

  // Update enrollment
  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: progress,
      isCompleted: isCompleted,
      completedAt: isCompleted ? new Date() : undefined
    }
  });
}