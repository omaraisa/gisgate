import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PayPalService } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const cartItemSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
});

const createOrderSchema = z.union([
  z.object({
    courseId: z.string().min(1, 'Course ID is required'),
  }),
  z.object({
    cartItems: z.array(cartItemSchema).min(1, 'At least one item is required'),
    totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  }),
]);

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const payload = await AuthService.verifyToken(token);

  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  // Get the full user data
  const user = await AuthService.getUserById(payload.userId);
  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username || undefined,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    fullNameArabic: user.fullNameArabic || undefined,
    fullNameEnglish: user.fullNameEnglish || undefined,
    role: user.role,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
  };
}

// POST /api/payments/create-order - Create PayPal order for course purchase
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const parsedBody = createOrderSchema.parse(body);

    let cartItems: Array<{ courseId: string; quantity: number; price: number }> = [];
    let totalAmount = 0;
    let orderDescription = '';

    // Handle cart checkout (multiple items)
    if ('cartItems' in parsedBody) {
      cartItems = parsedBody.cartItems;
      totalAmount = parsedBody.totalAmount;

      // Validate all courses exist and user is not already enrolled
      for (const item of cartItems) {
        const course = await prisma.course.findUnique({
          where: { id: item.courseId },
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
            { error: `Course ${item.courseId} not found` },
            { status: 404 }
          );
        }

        if (course.isFree) {
          return NextResponse.json(
            { error: `Course ${course.title} is free and does not require payment` },
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
            { error: `You are already enrolled in course: ${course.title}` },
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
            { error: `You already have a pending payment for course: ${course.title}` },
            { status: 400 }
          );
        }
      }

      orderDescription = `Cart checkout - ${cartItems.length} item(s)`;
    } else {
      // Handle single course purchase (backward compatibility)
      const courseId = parsedBody.courseId;

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

      cartItems = [{ courseId, quantity: 1, price: course.price }];
      totalAmount = course.price;
      orderDescription = course.title;
    }

    // Create PayPal order
    const paypalService = new PayPalService();
    const paypalOrder = await paypalService.createOrder(
      totalAmount,
      'USD', // Use USD as default currency
      orderDescription
    );

    // Create payment orders in database for each cart item
    const paymentOrders = [];
    for (const item of cartItems) {
      const paymentOrder = await prisma.paymentOrder.create({
        data: {
          userId: user.id,
          courseId: item.courseId,
          amount: item.price * item.quantity,
          currency: 'USD',
          status: 'PENDING' as any,
          paypalOrderId: paypalOrder.id,
        },
      });
      paymentOrders.push(paymentOrder);
    }

    return NextResponse.json({
      orderIds: paymentOrders.map(order => order.id),
      paypalOrderId: paypalOrder.id,
      paypalOrder: paypalOrder,
      totalAmount,
      itemCount: cartItems.length,
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