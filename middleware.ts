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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if user is authenticated (JWT verification only for performance)
  const isAuthenticated = token ? (await JWTUtils.verifyToken(token)) !== null : false;

  // Handle auth routes - redirect to home if already authenticated
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes
  if (protectedRoutes.some(route => {
    if (route.includes('*')) {
      const pattern = route.replace('*', '.*');
      return new RegExp(`^${pattern}`).test(pathname);
    }
    return pathname.startsWith(route);
  })) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
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