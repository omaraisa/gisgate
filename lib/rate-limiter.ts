/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (consider using Redis for production with multiple servers)
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Create a rate limiter with specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة مرة أخرى لاحقاً.',
  } = config;

  return async function rateLimitMiddleware(
    request: Request,
    getClientIdentifier?: () => string | Promise<string>
  ): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
    // Get client identifier (IP address or custom identifier)
    const clientId = getClientIdentifier 
      ? await getClientIdentifier() 
      : getClientIp(request);

    const key = `${clientId}:${new URL(request.url).pathname}`;
    const now = Date.now();

    // Initialize or get existing rate limit data
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      return {
        allowed: false,
        error: message,
        retryAfter,
      };
    }

    return { allowed: true };
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to unknown
  return 'unknown';
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.',
  }),

  // Moderate rate limit for API endpoints
  api: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً.',
  }),

  // Lenient rate limit for public content
  public: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  }),

  // Very strict for password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 requests per hour
    message: 'تم تجاوز عدد محاولات إعادة تعيين كلمة المرور. يرجى المحاولة بعد ساعة.',
  }),

  // Moderate for file uploads
  upload: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 uploads per 15 minutes
    message: 'تم تجاوز الحد المسموح من عمليات الرفع. يرجى المحاولة بعد 15 دقيقة.',
  }),

  // Strict for contact/newsletter submissions
  submission: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 submissions per hour
    message: 'تم تجاوز عدد محاولات الإرسال. يرجى المحاولة بعد ساعة.',
  }),
};

/**
 * Helper to create rate-limited API response
 */
export function createRateLimitResponse(retryAfter?: number) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Retry-After': retryAfter?.toString() || '60',
  });

  return new Response(
    JSON.stringify({
      error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة مرة أخرى لاحقاً.',
      retryAfter,
    }),
    {
      status: 429,
      headers,
    }
  );
}
