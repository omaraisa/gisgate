import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JWTUtils } from '@/lib/jwt-utils';

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/admin',
  '/courses/*/checkout',
  '/courses/*/lessons',
];

// Routes that should redirect to home if authenticated
const authRoutes = ['/auth'];

// Static and API routes to skip
const skipRoutes = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/fonts/',
  '/certificate_templates/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (skipRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const url = new URL(request.url);
  
  // Prevent infinite redirects - skip middleware for auth redirects
  if (url.searchParams.has('auth-redirect') || url.searchParams.has('_rsc')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if user is authenticated (JWT verification only for performance)
  let isAuthenticated = false;
  try {
    if (token) {
      const payload = await JWTUtils.verifyToken(token);
      isAuthenticated = payload !== null;
    }
  } catch (error) {
    // JWT verification failed - treat as unauthenticated but don't log in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('JWT verification failed in middleware:', error);
    }
    isAuthenticated = false;
  }

  // Handle auth routes - allow access during Coming Soon period
  // Comment out the redirect so /auth is always accessible
  /*
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated && token) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('auth-redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }
  */

  // Handle protected routes - only redirect if we're certain user is NOT authenticated
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes('*')) {
      const pattern = route.replace('*', '.*');
      return new RegExp(`^${pattern}`).test(pathname);
    }
    return pathname.startsWith(route);
  });

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('auth-redirect', 'true');
    redirectUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};