/**
 * Network Error Handler Utility
 * Provides comprehensive error handling for network requests with retry logic
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

interface NetworkErrorOptions {
  message: string;
  statusCode?: number;
  originalError?: Error;
  url?: string;
}

export class NetworkError extends Error {
  statusCode?: number;
  originalError?: Error;
  url?: string;

  constructor(options: NetworkErrorOptions) {
    super(options.message);
    this.name = 'NetworkError';
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.url = options.url;
  }
}

/**
 * Enhanced fetch with timeout, retries, and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000, // 30 seconds default
    retries = 3,
    retryDelay = 1000,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        await response.text().catch(() => 'فشل في قراءة رسالة الخطأ');
        throw new NetworkError({
          message: getErrorMessage(response.status),
          statusCode: response.status,
          url,
        });
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof NetworkError) {
        if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) {
          throw error;
        }
      }

      // Don't retry if it's the last attempt
      if (attempt === retries) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
    }
  }

  // If we got here, all retries failed
  throw new NetworkError({
    message: 'فشل الاتصال بالخادم بعد عدة محاولات. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
    originalError: lastError || undefined,
    url,
  });
}

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get user-friendly error message based on status code
 */
function getErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'البيانات المرسلة غير صحيحة. يرجى التحقق من المدخلات والمحاولة مرة أخرى.',
    401: 'يجب تسجيل الدخول للوصول إلى هذا المحتوى.',
    403: 'ليس لديك الصلاحيات الكافية للوصول إلى هذا المحتوى.',
    404: 'المحتوى المطلوب غير موجود.',
    408: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
    429: 'تم إرسال عدد كبير من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.',
    500: 'حدث خطأ في الخادم. نحن نعمل على إصلاحه.',
    502: 'الخادم غير متاح حالياً. يرجى المحاولة مرة أخرى لاحقاً.',
    503: 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى لاحقاً.',
    504: 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
  };

  return messages[statusCode] || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Listen for online/offline events
 */
export function addNetworkListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Parse API error response
 */
export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return data.error || data.message || getErrorMessage(response.status);
    } else {
      const text = await response.text();
      return text || getErrorMessage(response.status);
    }
  } catch {
    return getErrorMessage(response.status);
  }
}

/**
 * Safe fetch wrapper with comprehensive error handling
 */
export async function safeFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  // Check if online
  if (!isOnline()) {
    return {
      data: null,
      error: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
    };
  }

  try {
    const response = await fetchWithRetry(url, options);
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    if (error instanceof NetworkError) {
      return { data: null, error: error.message };
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { data: null, error: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.' };
      }
      return { data: null, error: error.message };
    }
    
    return { data: null, error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' };
  }
}
