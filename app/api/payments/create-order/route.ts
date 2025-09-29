import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PayPalService } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOrderSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
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

// POST /api/payments/create-order - Create PayPal order for course purchase
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { courseId } = createOrderSchema.parse(body);

    // Check if course exists and is paid
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        isFree: true,
        isPrivate: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.isFree) {
      return NextResponse.json(
        { error: 'This course is free and does not require payment' },
        { status: 400 }
      );
    }

    if (!course.price || course.price <= 0) {
      return NextResponse.json(
        { error: 'Course price is not set' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      );
    }

    // Check if there's already a pending payment for this course
    const existingOrder = await prisma.paymentOrder.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingOrder) {
      return NextResponse.json(
        { error: 'You already have a pending payment for this course' },
        { status: 400 }
      );
    }

    // Create PayPal order
    const paypalService = new PayPalService();
    const paypalOrder = await paypalService.createOrder(
      course.price,
      course.currency || 'USD',
      course.title
    );

    // Save order in database
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId: user.id,
        courseId: course.id,
        amount: course.price,
        currency: course.currency || 'USD',
        status: 'PENDING' as any,
        paypalOrderId: paypalOrder.id,
      },
    });

    return NextResponse.json({
      orderId: paymentOrder.id,
      paypalOrderId: paypalOrder.id,
      paypalOrder: paypalOrder,
    });

  } catch (error) {
    console.error('Create payment order error:', error);

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