import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  message?: string;
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function successResponse<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(message: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return errorResponse('Validation failed', 400, error.issues);
  }

  if (error instanceof Error) {
    // Handle specific error messages from requireAuth/requireAdmin
    if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
      return errorResponse(error.message, 401);
    }
    if (error.message === 'User not found or inactive') {
      return errorResponse(error.message, 401);
    }
    if (error.message === 'Forbidden: Admin access required') {
      return errorResponse(error.message, 403);
    }

    return errorResponse(error.message, 500);
  }

  return errorResponse('An unexpected error occurred', 500);
}
