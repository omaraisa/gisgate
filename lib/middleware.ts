import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export function withAuth(
  handler: (request: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
  } = {}
): (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      const authHeader = request.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.requireAuth) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        return handler(request as AuthenticatedRequest, context);
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token (not session token)
      const payload = await AuthService.verifyToken(token);
      
      if (!payload) {
        if (options.requireAuth) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          );
        }
        return handler(request as AuthenticatedRequest, context);
      }

      // Get user from database using the userId from JWT
      const user = await AuthService.getUserById(payload.userId);
      
      if (!user || !user.isActive) {
        if (options.requireAuth) {
          return NextResponse.json(
            { error: 'User not found or inactive' },
            { status: 401 }
          );
        }
        return handler(request as AuthenticatedRequest, context);
      }

      if (options.requireAdmin && user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      (request as AuthenticatedRequest).user = {
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
      };
      return handler(request as AuthenticatedRequest, context);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

// Helper function to get current user from request
export function getCurrentUser(request: AuthenticatedRequest): AuthUser | null {
  return request.user || null;
}