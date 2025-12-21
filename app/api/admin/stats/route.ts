import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const payload = await AuthService.verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parallel data fetching
    const [
      userCount,
      articleCount,
      courseCount,
      solutionCount,
      totalRevenueResult,
      recentUsers,
      recentPurchases
    ] = await Promise.all([
      prisma.user.count(),
      prisma.article.count(),
      prisma.course.count(),
      prisma.solution.count(),
      prisma.solutionPurchase.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'COMPLETED'
        }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          role: true
        }
      }),
      prisma.solutionPurchase.findMany({
        take: 5,
        orderBy: { purchasedAt: 'desc' },
        where: { status: 'COMPLETED' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          },
          solution: {
            select: {
              title: true
            }
          }
        }
      })
    ]);

    const totalRevenue = totalRevenueResult._sum.amount || 0;

    return NextResponse.json({
      counts: {
        users: userCount,
        articles: articleCount,
        courses: courseCount,
        solutions: solutionCount
      },
      revenue: totalRevenue,
      recentActivity: {
        users: recentUsers,
        purchases: recentPurchases
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
