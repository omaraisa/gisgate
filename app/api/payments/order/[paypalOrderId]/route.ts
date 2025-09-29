import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

// GET /api/payments/order/[paypalOrderId] - Get payment order by PayPal order ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paypalOrderId: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { paypalOrderId } = await params;

    // Find the payment order
    const paymentOrder = await prisma.paymentOrder.findFirst({
      where: {
        paypalOrderId: paypalOrderId,
        userId: user.id, // Ensure user can only access their own orders
      },
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

    return NextResponse.json({
      order: {
        id: paymentOrder.id,
        paypalOrderId: paymentOrder.paypalOrderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        status: paymentOrder.status,
        course: {
          id: paymentOrder.course.id,
          title: paymentOrder.course.title,
          titleEnglish: paymentOrder.course.titleEnglish,
        },
      },
    });

  } catch (error) {
    console.error('Get payment order error:', error);

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