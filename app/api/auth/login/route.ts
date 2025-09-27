import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email, password } = loginSchema.parse(body);

    // Authenticate user
    const user = await AuthService.authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = AuthService.generateToken(user);

    // Create session
    const sessionToken = await AuthService.createSession(
      user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    // Return success response
    return NextResponse.json({
      message: 'Login successful',
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
      },
      tokens: {
        accessToken: token,
        sessionToken,
      },
    });

  } catch (error) {
    console.error('Login error:', error);

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