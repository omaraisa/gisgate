import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
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

      // Clear any stale pending/processing orders for these cart items (user-scoped)
      try {
        for (const item of cartItems) {
          const staleOrders = await prisma.paymentOrder.findMany({
            where: {
              userId: user.id,
              courseId: item.courseId,
              status: { in: ['PENDING', 'PROCESSING'] },
            }
          });

          if (staleOrders.length > 0) {
            const staleIds = staleOrders.map(o => o.id);
            // Delete related transactions first (if any)
            await prisma.paymentTransaction.deleteMany({ where: { orderId: { in: staleIds } } });
            // Delete the stale orders
            await prisma.paymentOrder.deleteMany({ where: { id: { in: staleIds } } });
            console.log(`Cleared ${staleIds.length} stale pending orders for user ${user.id} and course ${item.courseId}`);
          }
        }
      } catch (cleanupErr) {
        console.error('Failed to cleanup stale pending orders for cart checkout:', cleanupErr);
      }

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
        // Clear any previous pending/processing payments for this user+course
        const previousPending = await prisma.paymentOrder.findMany({
          where: {
            userId: user.id,
            courseId: course.id,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
        });

        if (previousPending.length > 0) {
          const idsToRemove = previousPending.map(o => o.id);

          // Remove related transactions and refunds first
          await prisma.paymentTransaction.deleteMany({
            where: { orderId: { in: idsToRemove } },
          });
          await prisma.paymentRefund.deleteMany({
            where: { orderId: { in: idsToRemove } },
          });

          // Delete the stale payment orders
          await prisma.paymentOrder.deleteMany({
            where: { id: { in: idsToRemove } },
          });
        }
      }

      orderDescription = `Cart checkout - ${cartItems.length} item(s)`;
    } else {
      // Handle single course purchase (backward compatibility)
      const courseId = parsedBody.courseId;

      // Clear any stale pending/processing orders for this user+course before validation
      try {
        const staleOrders = await prisma.paymentOrder.findMany({
          where: {
            userId: user.id,
            courseId,
            status: { in: ['PENDING', 'PROCESSING'] },
          }
        });
        if (staleOrders.length > 0) {
          const staleIds = staleOrders.map(o => o.id);
          await prisma.paymentTransaction.deleteMany({ where: { orderId: { in: staleIds } } });
          await prisma.paymentOrder.deleteMany({ where: { id: { in: staleIds } } });
          console.log(`Cleared ${staleIds.length} stale pending orders for user ${user.id} and course ${courseId}`);
        }
      } catch (cleanupErr) {
        console.error('Failed to cleanup stale pending orders for single course purchase:', cleanupErr);
      }

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
      // Clear any previous pending/processing payments for this user+course (single-course flow)
      const previousPendingSingle = await prisma.paymentOrder.findMany({
        where: {
          userId: user.id,
          courseId: course.id,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      });

      if (previousPendingSingle.length > 0) {
        const idsToRemove = previousPendingSingle.map(o => o.id);

        await prisma.paymentTransaction.deleteMany({
          where: { orderId: { in: idsToRemove } },
        });
        await prisma.paymentRefund.deleteMany({
          where: { orderId: { in: idsToRemove } },
        });
        await prisma.paymentOrder.deleteMany({
          where: { id: { in: idsToRemove } },
        });
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
          status: 'PENDING',
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