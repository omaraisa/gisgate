import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import React from 'react';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Get or create a CSRF token for the current session
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * Middleware function to check CSRF token
 * Returns null if valid, or a NextResponse with error if invalid
 */
export async function csrfProtection(request: NextRequest) {
  // Only check CSRF for state-changing methods
  const method = request.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const isValid = await validateCsrfToken(request);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid CSRF token',
        message: 'رمز الأمان غير صالح. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
      }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}

/**
 * React hook to get CSRF token for client-side requests
 */
export function useCsrfToken() {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch CSRF token from API
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => setToken(data.token))
      .catch(err => console.error('Failed to fetch CSRF token:', err));
  }, []);

  return token;
}

/**
 * Helper to add CSRF token to fetch headers
 */
export function addCsrfHeader(headers: HeadersInit = {}, token: string): HeadersInit {
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}
