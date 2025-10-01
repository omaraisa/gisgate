import { NextRequest } from 'next/server';
import { AuthService } from './auth';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullNameArabic?: string;
  fullNameEnglish?: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  emailVerified: boolean;
  isActive: boolean;
}

/**
 * Require authentication for API routes using JWT tokens
 * This should be used instead of AuthService.validateSession() which is for database session tokens
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  
  // Verify JWT token (using jose library)
  const payload = await AuthService.verifyToken(token);
  
  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  // Get user from database using the userId from JWT
  const user = await AuthService.getUserById(payload.userId);
  
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  // Return auth user object
  return {
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
}

/**
 * Require admin role for API routes
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Require specific roles for API routes
 */
export async function requireRoles(request: NextRequest, allowedRoles: Array<'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER'>): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
