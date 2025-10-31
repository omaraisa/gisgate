import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // Validate JWT token
    await requireAuth(request);

    // Clear HTTP-only cookies
    const response = NextResponse.json({
      message: 'Logout successful',
    });

    // Determine if we should use secure cookies (only if HTTPS is properly configured)
    const useSecureCookies = process.env.NODE_ENV === 'production' && process.env.HTTPS_ENABLED === 'true';

    // Clear the HTTP-only auth-token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    // Clear the client-readable auth-token-client cookie
    response.cookies.set('auth-token-client', '', {
      httpOnly: false,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}