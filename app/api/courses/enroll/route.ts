import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET /api/courses/enroll - Get user's enrollments
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            category: true,
            totalLessons: true,
            durationValue: true,
            durationUnit: true,
            level: true
          }
        },
        lessonProgress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                slug: true,
                duration: true
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

// POST /api/courses/enroll - Enroll in a course
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        status: true,
        isFree: true,
        isPrivate: true,
        price: true,
        lessons: { select: { id: true } }
      }
    });

    if (!course || course.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Course not found or not available' }, { status: 404 });
    }

    // Check private course access (for now, only allow if user is admin or course is not private)
    if (course.isPrivate && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'This course is private and requires special access' }, { status: 403 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // For paid courses, check if payment is required (placeholder for future payment integration)
    if (!course.isFree && course.price && course.price > 0) {
      return NextResponse.json({
        error: 'This course requires payment',
        requiresPayment: true,
        price: course.price
      }, { status: 402 }); // 402 Payment Required
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: user.id,
        courseId: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            totalLessons: true
          }
        }
      }
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 });
  }
}