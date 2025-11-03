import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const newsletterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = newsletterSchema.parse(body);

    // Check if already subscribed
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingSubscriber && existingSubscriber.isActive) {
      return NextResponse.json(
        { error: 'You are already subscribed to our newsletter' },
        { status: 409 }
      );
    }

    // Create or reactivate subscription
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: validatedData.email.toLowerCase() },
      update: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        isActive: true,
        unsubscribedAt: null,
        source: 'footer',
      },
      create: {
        email: validatedData.email.toLowerCase(),
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        source: 'footer',
      },
    });

    // Send confirmation email
    const emailSent = await EmailService.sendNewsletterConfirmation({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
    });

    if (!emailSent) {
      console.error('Failed to send newsletter confirmation email to:', validatedData.email);
      // Don't fail the subscription if email fails, but log it
    }

    return NextResponse.json({
      message: 'Successfully subscribed to newsletter! Please check your email for confirmation.',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        subscribedAt: subscriber.subscribedAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Newsletter subscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}