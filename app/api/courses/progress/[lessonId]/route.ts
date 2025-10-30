import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// Dynamic imports to avoid build-time errors
async function getDependencies() {
  try {
    const [{ prisma }, { requireAuth }, { CertificateService }] = await Promise.all([
      import('@/lib/prisma'),
      import('@/lib/api-auth'),
      import('@/lib/certificate-service')
    ]);
    return { prisma, requireAuth, CertificateService };
  } catch (error) {
    console.warn('Failed to import dependencies:', error);
    return null;
  }
}

// GET /api/courses/progress/[lessonId] - Get lesson progress
export async function GET(request: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
  try {
    // Load dependencies dynamically
    const dependencies = await getDependencies();
    
    // Handle missing dependencies during build
    if (!dependencies) {
      return NextResponse.json({ 
        error: 'Service temporarily unavailable during build' 
      }, { status: 503 });
    }

    const { prisma, requireAuth } = dependencies;

    const user = await requireAuth(request);

    const params = await context.params;
    const lessonId = params.lessonId;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progress = await (prisma as any).lessonProgress.findUnique({
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
    // Load dependencies dynamically
    const dependencies = await getDependencies();
    
    // Handle missing dependencies during build
    if (!dependencies) {
      return NextResponse.json({ 
        error: 'Service temporarily unavailable during build' 
      }, { status: 503 });
    }

    const { prisma, requireAuth, CertificateService } = dependencies;

    const user = await requireAuth(request);

    const params = await context.params;
    const lessonId = params.lessonId;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    const { watchedTime, isCompleted } = await request.json();

    // Check if lesson exists and user is enrolled in its course
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lesson = await (prisma as any).video.findUnique({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrollment = await (prisma as any).courseEnrollment.findUnique({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progress = await (prisma as any).lessonProgress.upsert({
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
      await updateCourseProgress(enrollment.id, lesson.courseId, prisma, CertificateService);
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json({ error: 'Failed to update lesson progress' }, { status: 500 });
  }
}

// Helper function to update course progress
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateCourseProgress(enrollmentId: string, courseId: string, prisma: any, CertificateService: any) {
  if (!prisma || !CertificateService) {
    console.warn('Dependencies not available for course progress update');
    return;
  }

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