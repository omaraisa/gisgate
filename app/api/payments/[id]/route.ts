import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/payments/[id] - Get specific payment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const payment = await prisma.paymentOrder.findFirst({
      where: {
        id: id,
        userId: user.id, // Ensure user can only access their own payments
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleEnglish: true,
            description: true,
            featuredImage: true,
            authorName: true,
            authorNameEnglish: true,
          },
        },
        transactions: {
          select: {
            id: true,
            paypalTransactionId: true,
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
            paypalRefundId: true,
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
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalPaid = payment.transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunded = payment.refunds
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const netAmount = totalPaid - totalRefunded;

    return NextResponse.json({
      payment: {
        ...payment,
        summary: {
          totalPaid,
          totalRefunded,
          netAmount,
          canRefund: payment.status === 'COMPLETED' && netAmount > 0,
        },
      },
    });

  } catch (error) {
    console.error('Get payment details error:', error);

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