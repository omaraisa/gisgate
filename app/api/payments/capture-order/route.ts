import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PayPalService } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const captureOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
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

// POST /api/payments/capture-order - Capture PayPal order and complete payment
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { orderId } = captureOrderSchema.parse(body);

    // Find the payment order
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: {
        course: true,
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

    // Check if order is already completed
    if (paymentOrder.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment order already completed' },
        { status: 400 }
      );
    }

    // Check if order is still pending
    if (paymentOrder.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payment order is not in a capturable state' },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const paypalService = new PayPalService();
    const captureResult = await paypalService.captureOrder(paymentOrder.paypalOrderId!);

    // Update payment order status
    const updatedOrder = await prisma.paymentOrder.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED' as any,
        paypalPaymentId: captureResult.id,
        paidAt: new Date(),
      },
    });

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        orderId: orderId,
        paypalTransactionId: captureResult.id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        status: 'COMPLETED' as any,
        // Note: Fee calculation removed for now - requires proper PayPal response parsing
      },
    });

    // Enroll the user in the course
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: user.id,
        courseId: paymentOrder.courseId,
      },
    });

    return NextResponse.json({
      order: updatedOrder,
      enrollment: enrollment,
      captureResult: captureResult,
    });

  } catch (error) {
    console.error('Capture payment order error:', error);

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