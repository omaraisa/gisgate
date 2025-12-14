import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { requireAuth } from '@/lib/api-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type EnrollmentWithDetails = Prisma.CourseEnrollmentGetPayload<{
  include: {
    course: {
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        level: true,
        language: true,
        totalLessons: true,
        createdAt: true,
      },
    },
    lessonProgress: {
      select: {
        id: true,
        lessonId: true,
        watchedTime: true,
        isCompleted: true,
        completedAt: true,
        lastWatchedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            duration: true,
            order: true,
          },
        },
      },
      orderBy: { lesson: { order: 'asc' } },
    },
    certificates: {
      select: {
        id: true,
        certificateId: true,
        createdAt: true,
        arTemplateId: true,
        enTemplateId: true,
      },
    },
  },
}>;

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullNameArabic: z.string().optional(),
  fullNameEnglish: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Invalid website URL"
  }).optional(),
  avatar: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Invalid avatar URL"
  }).optional(),
}).transform((data) => ({
  ...data,
  // Convert empty strings to undefined
  firstName: data.firstName || undefined,
  lastName: data.lastName || undefined,
  fullNameArabic: data.fullNameArabic || undefined,
  fullNameEnglish: data.fullNameEnglish || undefined,
  bio: data.bio || undefined,
  website: data.website || undefined,
  avatar: data.avatar || undefined,
}));

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const fullUser = await AuthService.getUserById(user.id);
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get enrolled courses with progress
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            excerpt: true,
            featuredImage: true,
            category: true,
            level: true,
            language: true,
            totalLessons: true,
            createdAt: true,
          },
        },
        lessonProgress: {
          select: {
            id: true,
            lessonId: true,
            watchedTime: true,
            isCompleted: true,
            completedAt: true,
            lastWatchedAt: true,
            lesson: {
              select: {
                id: true,
                title: true,
                slug: true,

                order: true,
              },
            },
          },
          orderBy: { lesson: { order: 'asc' } },
        },
        certificates: {
          select: {
            id: true,
            certificateId: true,
            createdAt: true,
            arTemplateId: true,
            enTemplateId: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Get payment history
    const payments = await prisma.paymentOrder.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleEnglish: true,
            featuredImage: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        refunds: {
          select: {
            id: true,
            amount: true,
            currency: true,
            reason: true,
            status: true,
            requestedAt: true,
          },
          orderBy: {
            requestedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to recent payments
    });

    // Calculate payment statistics
    const totalPaid = payments.reduce((sum, payment) => {
      const completedTransactions = payment.transactions.filter(t => t.status === 'COMPLETED');
      return sum + completedTransactions.reduce((tSum, t) => tSum + t.amount, 0);
    }, 0);

    const totalRefunded = payments.reduce((sum, payment) => {
      const completedRefunds = payment.refunds.filter(r => r.status === 'COMPLETED');
      return sum + completedRefunds.reduce((rSum, r) => rSum + r.amount, 0);
    }, 0);

    // Format enrolled courses with progress
    const enrolledCourses = enrollments.map((enrollment: EnrollmentWithDetails) => {
      const completedLessons = enrollment.lessonProgress.filter((lp) => lp.isCompleted).length;
      const totalLessons = enrollment.course.totalLessons || enrollment.lessonProgress.length;
      
      // Use stored progress if no lesson progress records exist (for migrated data)
      let progressPercentage: number;
      if (enrollment.lessonProgress.length === 0 && enrollment.progress !== undefined) {
        progressPercentage = enrollment.progress;
      } else {
        progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      }

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        excerpt: enrollment.course.excerpt,
        featuredImage: enrollment.course.featuredImage,
        category: enrollment.course.category,
        level: enrollment.course.level,
        language: enrollment.course.language,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        isCompleted: enrollment.isCompleted,
        progress: {
          percentage: progressPercentage,
          completedLessons,
          totalLessons,
          totalWatchTime: enrollment.lessonProgress.reduce((total: number, lp) => total + lp.watchedTime, 0),
        },
        lessons: enrollment.lessonProgress.map((lp) => ({
          id: lp.lesson.id,
          title: lp.lesson.title,
          slug: lp.lesson.slug,
          duration: lp.lesson.duration,
          order: lp.lesson.order,
          watchedTime: lp.watchedTime,
          isCompleted: lp.isCompleted,
          completedAt: lp.completedAt,
          lastWatchedAt: lp.lastWatchedAt,
        })),
        certificates: enrollment.certificates.map((cert) => ({
          id: cert.id,
          certificateId: cert.certificateId,
          hasArabic: !!cert.arTemplateId,
          hasEnglish: !!cert.enTemplateId,
          earnedAt: cert.createdAt,
        })),
      };
    });

    // Calculate learning statistics
    const totalEnrolledCourses = enrollments.length;
    // Count completed courses and certificates from enrolledCourses (which has calculated progress)
    const completedCourses = enrolledCourses.filter((course) => course.isCompleted || course.progress.percentage >= 100).length;
    const certificatesEarned = completedCourses; // One certificate per completed course
    
    const totalLessonsCompleted = enrollments.reduce((total: number, enrollment: EnrollmentWithDetails) => {
      return total + enrollment.lessonProgress.filter((lp) => lp.isCompleted).length;
    }, 0);
    const totalLessonsWatched = enrollments.reduce((total: number, enrollment: EnrollmentWithDetails) => {
      return total + enrollment.lessonProgress.length;
    }, 0);
    const totalWatchTime = enrollments.reduce((total: number, enrollment: EnrollmentWithDetails) => {
      return total + enrollment.lessonProgress.reduce((sum: number, lp) => sum + lp.watchedTime, 0);
    }, 0);
    // Don't return sensitive information
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = fullUser; // eslint-disable-line @typescript-eslint/no-unused-vars

    return NextResponse.json({
      user: safeUser,
      learningProfile: {
        enrolledCourses,
        statistics: {
          totalEnrolledCourses,
          completedCourses,
          totalLessonsCompleted,
          totalLessonsWatched,
          totalWatchTime, // in seconds
          certificatesEarned,
          completionRate: totalEnrolledCourses > 0 ? Math.round((completedCourses / totalEnrolledCourses) * 100) : 0,
        },
      },
      paymentProfile: {
        recentPayments: payments.slice(0, 5), // Show only 5 most recent
        statistics: {
          totalPaid,
          totalRefunded,
          netSpent: totalPaid - totalRefunded,
          totalPayments: payments.length,
        },
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await AuthService.updateUser(user.id, validatedData);

    // Don't return sensitive information
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = updatedUser; // eslint-disable-line @typescript-eslint/no-unused-vars

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: safeUser,
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}