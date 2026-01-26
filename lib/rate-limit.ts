import { NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production with multiple instances, use Redis/Upstash
const rateLimitStore = new Map<string, RateLimitStore>();

export interface RateLimitConfig {
  /**
   * Unique identifier for this rate limit (e.g., 'api:login', 'api:upload')
   */
  id: string;
  
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;
  
  /**
   * Time window in milliseconds
   */
  window: number;
}

/**
 * Rate limiter middleware for API routes
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 status if rate limit exceeded
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): NextResponse | null {
  const key = `${config.id}:${identifier}`;
  const now = Date.now();
  
  // Clean up old entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.window,
    });
    return null;
  }
  
  if (current.count >= config.limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
        },
      }
    );
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  
  return null;
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for reverse proxy scenarios)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default (not ideal but prevents crashes)
  return 'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

/**
 * Predefined rate limit configurations for common scenarios
 */
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  AUTH_LOGIN: {
    id: 'api:auth:login',
    limit: 5, // 5 attempts
    window: 15 * 60 * 1000, // per 15 minutes
  },
  AUTH_REGISTER: {
    id: 'api:auth:register',
    limit: 3, // 3 registrations
    window: 60 * 60 * 1000, // per hour
  },
  AUTH_FORGOT_PASSWORD: {
    id: 'api:auth:forgot-password',
    limit: 3,
    window: 60 * 60 * 1000, // per hour
  },
  
  // File upload limits
  UPLOAD_IMAGE: {
    id: 'api:admin:upload-image',
    limit: 20, // 20 uploads
    window: 60 * 1000, // per minute
  },
  UPLOAD_FILE: {
    id: 'api:admin:upload-file',
    limit: 10,
    window: 60 * 1000, // per minute
  },
  
  // Admin action limits
  ADMIN_CREATE: {
    id: 'api:admin:create',
    limit: 30, // 30 creates
    window: 60 * 1000, // per minute
  },
  ADMIN_UPDATE: {
    id: 'api:admin:update',
    limit: 50,
    window: 60 * 1000, // per minute
  },
  ADMIN_DELETE: {
    id: 'api:admin:delete',
    limit: 20,
    window: 60 * 1000, // per minute
  },
  
  // Payment endpoints
  PAYMENT_CREATE: {
    id: 'api:payment:create',
    limit: 10,
    window: 60 * 60 * 1000, // per hour
  },
  
  // General API limits
  API_READ: {
    id: 'api:read',
    limit: 100,
    window: 60 * 1000, // per minute
  },
} as const;
