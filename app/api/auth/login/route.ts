import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting - prevent brute force attacks
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.AUTH_LOGIN);
    if (rateLimitResult) {
      return rateLimitResult;
    }

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
    const token = await AuthService.generateToken(user);

    // Create response with cookie
    const response = NextResponse.json({
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
      token: token, // Only return JWT token
    });

    // Determine if we should use secure cookies (only if HTTPS is properly configured)
    const useSecureCookies = process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true';
    
    // Debug logging for cookie settings (remove in production)
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true') {
      console.log('Cookie settings:', {
        nodeEnv: process.env.NODE_ENV,
        httpsEnabled: process.env.HTTPS_ENABLED,
        useSecureCookies,
        userRole: user.role
      });
    }

    // Set HTTP-only cookie for middleware (server-side auth)
    response.cookies.set('auth-token', token, {
      httpOnly: true, // Keep server-side only for security
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Set readable cookie for client-side JavaScript
    response.cookies.set('auth-token-client', token, {
      httpOnly: false, // Allow client-side access
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

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