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

    // Find all payment orders with this PayPal order ID (for cart checkout)
    const paymentOrders = await prisma.paymentOrder.findMany({
      where: { 
        paypalOrderId: orderId,
        userId: user.id, // Ensure user can only access their own orders
      },
      include: {
        course: true,
      },
    });

    if (!paymentOrders || paymentOrders.length === 0) {
      return NextResponse.json(
        { error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Check if all orders are still pending
    const nonPendingOrders = paymentOrders.filter(order => order.status !== 'PENDING');
    if (nonPendingOrders.length > 0) {
      return NextResponse.json(
        { error: 'Some payment orders are not in a capturable state' },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const paypalService = new PayPalService();
    const captureResult = await paypalService.captureOrder(orderId);

    // Update all payment orders status
    const updatedOrders = [];
    const enrollments = [];

    for (const paymentOrder of paymentOrders) {
      const updatedOrder = await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: 'COMPLETED' as any,
          paypalPaymentId: captureResult.id,
          paidAt: new Date(),
        },
      });
      updatedOrders.push(updatedOrder);

      // Create payment transaction record for each order
      await prisma.paymentTransaction.create({
        data: {
          orderId: paymentOrder.id,
          paypalTransactionId: captureResult.id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          status: 'COMPLETED' as any,
        },
      });

      // Enroll the user in each course
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          userId: user.id,
          courseId: paymentOrder.courseId,
        },
      });
      enrollments.push(enrollment);
    }

    return NextResponse.json({
      orders: updatedOrders,
      enrollments: enrollments,
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