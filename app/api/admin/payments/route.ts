import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const user = await AuthService.validateSession(token);

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return user;
}

// GET /api/admin/payments - Get all payments (admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    const [payments, total] = await Promise.all([
      prisma.paymentOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullNameArabic: true,
              fullNameEnglish: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              titleEnglish: true,
              price: true,
              currency: true,
            },
          },
          transactions: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              paypalFee: true,
              netAmount: true,
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
              processedAt: true,
            },
            orderBy: {
              requestedAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.paymentOrder.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = {
      totalRevenue: payments.reduce((sum, p) => {
        const completedTransactions = p.transactions.filter(t => t.status === 'COMPLETED');
        return sum + completedTransactions.reduce((tSum, t) => tSum + t.amount, 0);
      }, 0),
      totalRefunds: payments.reduce((sum, p) => {
        const completedRefunds = p.refunds.filter(r => r.status === 'COMPLETED');
        return sum + completedRefunds.reduce((rSum, r) => rSum + r.amount, 0);
      }, 0),
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      completedPayments: payments.filter(p => p.status === 'COMPLETED').length,
    };

    return NextResponse.json({
      payments,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get admin payments error:', error);

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}