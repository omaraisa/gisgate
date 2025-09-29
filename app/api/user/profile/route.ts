import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  fullNameArabic: z.string().min(1, 'Full name in Arabic is required').optional(),
  fullNameEnglish: z.string().min(1, 'Full name in English is required').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const user = await AuthService.validateSession(token);

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

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
            duration: true,
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
            template: {
              select: {
                name: true,
                language: true,
              },
            },
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
    // Format enrolled courses with progress
    const enrolledCourses = enrollments.map((enrollment: any) => {
      const completedLessons = enrollment.lessonProgress.filter((lp: any) => lp.isCompleted).length;
      const totalLessons = enrollment.course.totalLessons || enrollment.lessonProgress.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

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
          totalWatchTime: enrollment.lessonProgress.reduce((total: number, lp: any) => total + lp.watchedTime, 0),
        },
        lessons: enrollment.lessonProgress.map((lp: any) => ({
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
        certificates: enrollment.certificates.map((cert: any) => ({
          id: cert.id,
          certificateId: cert.certificateId,
          templateName: cert.template.name,
          language: cert.template.language,
          earnedAt: cert.createdAt,
        })),
      };
    });
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

// PATCH /api/user/profile/password - Change password
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Verify current password
    const fullUser = await AuthService.getUserById(user.id);
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await AuthService.verifyPassword(currentPassword, fullUser.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedNewPassword = await AuthService.hashPassword(newPassword);
    await AuthService.updateUser(user.id, { password: hashedNewPassword });

    // Invalidate all sessions except current one
    // Note: In a real app, you'd want to keep the current session valid
    await AuthService.invalidateAllUserSessions(user.id);

    return NextResponse.json({
      message: 'Password changed successfully. Please login again.',
    });

  } catch (error) {
    console.error('Change password error:', error);

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