import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { authenticated: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await AuthService.validateSession(token);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Return user info (AuthUser is already safe)
    return NextResponse.json({
      authenticated: true,
      user: user,
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Authentication check failed' },
      { status: 500 }
    );
  }
}