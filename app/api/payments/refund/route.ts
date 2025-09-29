import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PayPalService } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const refundOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().optional(),
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

// POST /api/payments/refund - Process refund for a payment order
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { orderId, amount, reason } = refundOrderSchema.parse(body);

    // Find the payment order
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: {
        course: true,
        transactions: true,
      },
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Check if the order belongs to the authenticated user
    if (paymentOrder.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment order' },
        { status: 403 }
      );
    }

    // Check if order is completed
    if (paymentOrder.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed payments can be refunded' },
        { status: 400 }
      );
    }

    // Check if refund amount is valid
    if (amount > paymentOrder.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original payment amount' },
        { status: 400 }
      );
    }

    // Check for existing refunds
    const existingRefunds = await prisma.paymentRefund.findMany({
      where: { orderId: orderId },
    });

    const totalRefunded = existingRefunds
      .filter(refund => refund.status === 'COMPLETED')
      .reduce((sum, refund) => sum + refund.amount, 0);

    if (totalRefunded + amount > paymentOrder.amount) {
      return NextResponse.json(
        { error: 'Total refund amount cannot exceed original payment amount' },
        { status: 400 }
      );
    }

    // Get the capture ID from transactions
    const completedTransaction = paymentOrder.transactions.find(
      t => t.status === 'COMPLETED'
    );

    if (!completedTransaction) {
      return NextResponse.json(
        { error: 'No completed transaction found for this order' },
        { status: 400 }
      );
    }

    // Process refund with PayPal
    const paypalService = new PayPalService();
    const refundResult = await paypalService.refundPayment(
      completedTransaction.paypalTransactionId,
      amount,
      paymentOrder.currency,
      reason
    );

    // Create refund record
    const refund = await prisma.paymentRefund.create({
      data: {
        orderId: orderId,
        paypalRefundId: refundResult.id,
        amount: amount,
        currency: paymentOrder.currency,
        reason: reason,
        status: 'COMPLETED' as any,
        processedAt: new Date(),
      },
    });

    // Update order status if fully refunded
    const newTotalRefunded = totalRefunded + amount;
    if (newTotalRefunded >= paymentOrder.amount) {
      await prisma.paymentOrder.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' as any },
      });
    } else if (newTotalRefunded > 0) {
      await prisma.paymentOrder.update({
        where: { id: orderId },
        data: { status: 'PARTIALLY_REFUNDED' as any },
      });
    }

    // If full refund, remove course enrollment
    if (newTotalRefunded >= paymentOrder.amount) {
      await prisma.courseEnrollment.deleteMany({
        where: {
          userId: user.id,
          courseId: paymentOrder.courseId,
        },
      });
    }

    return NextResponse.json({
      refund: refund,
      refundResult: refundResult,
    });

  } catch (error) {
    console.error('Refund payment error:', error);

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