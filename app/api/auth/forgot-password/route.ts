import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Initiate password reset (don't reveal if email exists or not for security)
    const resetToken = await AuthService.initiatePasswordReset(email); // eslint-disable-line @typescript-eslint/no-unused-vars

    // In a real application, you would send an email here
    // For now, we'll just return success
    // You should integrate with an email service like SendGrid, Mailgun, etc.

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // For development/testing, you might want to return the token:
      // resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}