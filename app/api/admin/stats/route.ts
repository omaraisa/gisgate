import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users stats
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    });
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
    const activeUsersLast7Days = await prisma.user.count({
      where: {
        lastLogin: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Enrollment stats
    const totalEnrollments = await prisma.courseEnrollment.count();
    const activeEnrollments = await prisma.courseEnrollment.count({
      where: {
        isCompleted: false,
        progress: {
          gt: 0,
        },
      },
    });
    const completedEnrollments = await prisma.courseEnrollment.count({
      where: {
        isCompleted: true,
      },
    });
    const enrollmentsLast30Days = await prisma.courseEnrollment.count({
      where: {
        enrolledAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Completion rate
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedEnrollments / totalEnrollments) * 100) 
      : 0;

    // Certificate stats
    const totalCertificates = await prisma.certificate.count();
    const certificatesLast30Days = await prisma.certificate.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Solution download stats
    const totalDownloads = await prisma.solutionDownload.count();
    const downloadsLast30Days = await prisma.solutionDownload.count({
      where: {
        downloadedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Most popular courses
    const popularCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Most active users
    const activeUsersList = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            solutionDownloads: true,
          },
        },
      },
      orderBy: {
        lastLogin: 'desc',
      },
      take: 10,
    });

    // User activity over time (last 30 days) - using Prisma groupBy for type safety
    const usersByDay = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const userActivityByDay = usersByDay.map(day => ({
      date: new Date(day.createdAt.toISOString().split('T')[0]),
      count: BigInt(day._count.id),
    }));

    // Enrollment activity over time (last 30 days) - using Prisma groupBy
    const enrollmentsByDay = await prisma.courseEnrollment.groupBy({
      by: ['enrolledAt'],
      where: {
        enrolledAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        enrolledAt: 'asc',
      },
    });

    const enrollmentActivityByDay = enrollmentsByDay.map(day => ({
      date: new Date(day.enrolledAt.toISOString().split('T')[0]),
      count: BigInt(day._count.id),
    }));

    // Completion activity over time (last 30 days) - using Prisma groupBy
    const completionsByDay = await prisma.courseEnrollment.groupBy({
      by: ['completedAt'],
      where: {
        completedAt: {
          gte: thirtyDaysAgo,
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    const completionActivityByDay = completionsByDay.map(day => ({
      date: day.completedAt ? new Date(day.completedAt.toISOString().split('T')[0]) : new Date(),
      count: BigInt(day._count.id),
    }));

    // Payment stats
    const totalRevenue = await prisma.paymentOrder.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const revenueLast30Days = await prisma.paymentOrder.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Average course progress
    const avgProgress = await prisma.courseEnrollment.aggregate({
      where: {
        isCompleted: false,
      },
      _avg: {
        progress: true,
      },
    });

    // Lesson completion stats
    const totalLessonProgress = await prisma.lessonProgress.count();
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        isCompleted: true,
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newLast30Days: newUsersLast30Days,
        activeLast7Days: activeUsersLast7Days,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        completionRate,
        enrollmentsLast30Days,
        avgProgress: Math.round(avgProgress._avg.progress || 0),
      },
      certificates: {
        total: totalCertificates,
        issuedLast30Days: certificatesLast30Days,
      },
      downloads: {
        total: totalDownloads,
        last30Days: downloadsLast30Days,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        last30Days: revenueLast30Days._sum.amount || 0,
      },
      lessons: {
        totalProgress: totalLessonProgress,
        completed: completedLessons,
      },
      popularCourses: popularCourses.map(course => ({
        id: course.id,
        title: course.title,
        enrollments: course._count.enrollments,
      })),
      activeUsers: activeUsersList.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullNameArabic || user.firstName || user.email,
        lastLogin: user.lastLogin,
        enrollments: user._count.enrollments,
        certificates: user._count.certificates,
        downloads: user._count.solutionDownloads,
      })),
      charts: {
        userActivity: userActivityByDay.map(row => ({
          date: row.date,
          count: Number(row.count),
        })),
        enrollmentActivity: enrollmentActivityByDay.map(row => ({
          date: row.date,
          count: Number(row.count),
        })),
        completionActivity: completionActivityByDay.map(row => ({
          date: row.date,
          count: Number(row.count),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    // Handle authentication errors
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('authentication'))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
