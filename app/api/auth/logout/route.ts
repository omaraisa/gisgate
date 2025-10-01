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

    // Clear the HTTP-only auth-token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    // Clear the client-readable auth-token-client cookie
    response.cookies.set('auth-token-client', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
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