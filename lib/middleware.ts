import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export async function withAuth(
  handler: (request: AuthenticatedRequest, context?: unknown) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
  } = {}
) {
  return async (request: NextRequest, context?: unknown) => {
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
      const user = await AuthService.validateSession(token);

      if (!user) {
        if (options.requireAuth) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
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

      (request as AuthenticatedRequest).user = user;
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