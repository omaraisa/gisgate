import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailService } from '@/lib/email';
import { z } from 'zod';
import { RateLimiters, createRateLimitResponse } from '@/lib/rate-limiter';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  fullNameArabic: z.string().min(1, 'Full name in Arabic is required'),
  fullNameEnglish: z.string().min(1, 'Full name in English is required'),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await RateLimiters.auth(request);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.retryAfter);
  }

  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if email is already taken
    const existingUser = await AuthService.getUserByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try logging in instead or use a different email address.' },
        { status: 409 }
      );
    }

    // Check if username is taken (if provided)
    if (validatedData.username) {
      const existingUsername = await AuthService.getUserByEmail(validatedData.username);
      if (existingUsername) {
        return NextResponse.json(
          { error: 'This username is already taken. Please choose a different one.' },
          { status: 409 }
        );
      }
    }

    // Register the user
    const user = await AuthService.registerUser(validatedData);

    // Send verification email
    try {
      const emailSent = await EmailService.sendWelcomeEmail({
        name: user.fullNameArabic || user.fullNameEnglish || user.firstName || 'User',
        email: user.email,
        verificationToken: user.emailVerificationToken!,
      });

      if (!emailSent) {
        console.error('Failed to send verification email to:', user.email);
        // Don't fail registration if email fails, but log it
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Generate JWT token
    const authUser = {
      id: user.id,
      email: user.email,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      fullNameArabic: user.fullNameArabic ?? undefined,
      fullNameEnglish: user.fullNameEnglish ?? undefined,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };
    const token = await AuthService.generateToken(authUser);

    // Return success response
    return NextResponse.json({
      message: 'User registered successfully. Please check your email for verification.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullNameArabic: user.fullNameArabic,
        fullNameEnglish: user.fullNameEnglish,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      token,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Please check your input and try again. All required fields must be filled correctly.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again later or contact support if the problem persists.' },
      { status: 500 }
    );
  }
}