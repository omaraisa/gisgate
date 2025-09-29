import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { CertificateService } from '@/lib/certificate-service';

// GET /api/courses/progress/[lessonId] - Get lesson progress
export async function GET(request: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await AuthService.validateSession(token);

    if (!user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const params = await context.params;
    const lessonId = params.lessonId;

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
}

// POST /api/courses/progress/[lessonId] - Update lesson progress
export async function POST(request: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await AuthService.validateSession(token);

    if (!user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const params = await context.params;
    const lessonId = params.lessonId;

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
}

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

  // Generate certificate if course is completed
  if (isCompleted) {
    try {
      await CertificateService.generateCertificate(enrollmentId);
      console.log(`Certificate generated for enrollment ${enrollmentId}`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      // Don't fail the progress update if certificate generation fails
    }
  }
}