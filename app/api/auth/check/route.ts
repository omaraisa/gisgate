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
    
    // Try to verify as JWT token (server-side only)
    let payload;
    try {
      payload = await AuthService.verifyToken(token);
    } catch {
      // If JWT verification fails, token is invalid
      return NextResponse.json(
        { authenticated: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    if (!payload) {
      return NextResponse.json(
        { authenticated: false, message: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Get user from database using the userId from JWT
    const user = await AuthService.getUserById(payload.userId);
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { authenticated: false, message: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Return user info
    return NextResponse.json({
      authenticated: true,
      user: {
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
      },
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Authentication check failed' },
      { status: 500 }
    );
  }
}