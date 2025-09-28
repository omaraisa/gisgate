import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/courses/enroll - Get user's enrollments
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, use a mock user ID
    const mockUserId = 'test-user-123';

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: mockUserId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
            category: true,
            totalLessons: true,
            duration: true,
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
    // For testing purposes, use a mock user ID
    const mockUserId = 'test-user-123';

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, isFree: true, lessons: { select: { id: true } } }
    });

    if (!course || course.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Course not found or not available' }, { status: 404 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: mockUserId,
          courseId: courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: mockUserId,
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