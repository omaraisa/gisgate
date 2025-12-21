/**
 * Client-side Error Tracking
 * Monitors and logs errors for debugging and improvement
 */

interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  componentStack?: string;
  additionalInfo?: Record<string, unknown>;
}

interface ErrorTrackingConfig {
  enabled: boolean;
  apiEndpoint?: string;
  maxLogsStored: number;
  sendToServer: boolean;
}

class ErrorTracker {
  private config: ErrorTrackingConfig;
  private errorLogs: ErrorLog[] = [];
  private readonly STORAGE_KEY = 'gisgate_error_logs';

  constructor(config?: Partial<ErrorTrackingConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ERROR_TRACKING === 'true',
      apiEndpoint: '/api/errors/log',
      maxLogsStored: 50,
      sendToServer: true,
      ...config,
    };

    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initializeTracking();
      this.loadStoredLogs();
    }
  }

  private initializeTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        type: 'uncaught-error',
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        type: 'unhandled-rejection',
      });
    });
  }

  private loadStoredLogs() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.errorLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load stored error logs:', error);
    }
  }

  private saveToStorage() {
    try {
      // Keep only the most recent logs
      const logsToStore = this.errorLogs.slice(-this.config.maxLogsStored);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logsToStore));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  async logError(error: {
    message: string;
    stack?: string;
    url?: string;
    type?: string;
    userId?: string;
    componentStack?: string;
    additionalInfo?: Record<string, unknown>;
  }) {
    if (!this.config.enabled) {
      return;
    }

    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      url: error.url || window.location.href,
      userAgent: navigator.userAgent,
      userId: error.userId,
      componentStack: error.componentStack,
      additionalInfo: {
        type: error.type,
        ...error.additionalInfo,
      },
    };

    // Add to local logs
    this.errorLogs.push(errorLog);
    this.saveToStorage();

    // Send to server if enabled
    if (this.config.sendToServer && this.config.apiEndpoint) {
      try {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorLog),
        });
      } catch (serverError) {
        // Silently fail - don't want error tracking to cause more errors
        console.error('Failed to send error to server:', serverError);
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorLog);
    }
  }

  logApiError(
    endpoint: string,
    statusCode: number,
    message: string,
    additionalInfo?: Record<string, unknown>
  ) {
    this.logError({
      message: `API Error: ${endpoint} - ${message}`,
      type: 'api-error',
      additionalInfo: {
        endpoint,
        statusCode,
        ...additionalInfo,
      },
    });
  }

  logUserAction(action: string, additionalInfo?: Record<string, unknown>) {
    // Log important user actions for debugging context
    if (process.env.NODE_ENV === 'development') {
      console.log('User action:', action, additionalInfo);
    }
  }

  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-count);
  }

  clearErrorLogs() {
    this.errorLogs = [];
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  getErrorCount(): number {
    return this.errorLogs.length;
  }

  exportErrors(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

// Create singleton instance
export const errorTracker = new ErrorTracker();

// Export for use in React components
export const useErrorTracking = () => {
  return {
    logError: errorTracker.logError.bind(errorTracker),
    logApiError: errorTracker.logApiError.bind(errorTracker),
    logUserAction: errorTracker.logUserAction.bind(errorTracker),
    getRecentErrors: errorTracker.getRecentErrors.bind(errorTracker),
    clearErrors: errorTracker.clearErrorLogs.bind(errorTracker),
    errorCount: errorTracker.getErrorCount(),
  };
};

// Helper to track API calls with automatic error logging
export async function trackedFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      errorTracker.logApiError(url, response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.logError({
        message: `Fetch failed: ${url}`,
        stack: error.stack,
        type: 'fetch-error',
        additionalInfo: { url, options },
      });
    }
    throw error;
  }
}
