'use client';

import React from 'react';
import { RefreshCw, AlertCircle, WifiOff } from 'lucide-react';

export interface RetryButtonProps {
  /** Function to call when retry is clicked */
  onRetry: () => void | Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Custom retry button text */
  retryText?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Show icon */
  showIcon?: boolean;
}

/**
 * Retry button component with loading and error states
 */
export function RetryButton({
  onRetry,
  isLoading = false,
  error,
  retryText = 'إعادة المحاولة',
  size = 'md',
  variant = 'primary',
  showIcon = true,
}: RetryButtonProps) {
  const [localLoading, setLocalLoading] = React.useState(false);

  const handleRetry = async () => {
    setLocalLoading(true);
    try {
      await onRetry();
    } finally {
      setLocalLoading(false);
    }
  };

  const loading = isLoading || localLoading;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-800 border border-gray-300',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      <button
        onClick={handleRetry}
        disabled={loading}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-lg font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
          transition-all duration-200
        `}
      >
        {showIcon && (
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
        )}
        <span>{retryText}</span>
      </button>
    </div>
  );
}

export interface ErrorStateProps {
  /** Error message or title */
  title?: string;
  /** Detailed error description */
  description?: string;
  /** Retry function */
  onRetry?: () => void | Promise<void>;
  /** Retry button text */
  retryText?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Show network status icon */
  showNetworkIcon?: boolean;
}

/**
 * Full error state component with retry functionality
 */
export function ErrorState({
  title = 'حدث خطأ',
  description = 'عذراً، حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
  onRetry,
  retryText = 'إعادة المحاولة',
  icon,
  showNetworkIcon = false,
}: ErrorStateProps) {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const defaultIcon = showNetworkIcon ? (
    isOnline ? (
      <AlertCircle className="h-12 w-12 text-red-500" />
    ) : (
      <WifiOff className="h-12 w-12 text-gray-500" />
    )
  ) : (
    <AlertCircle className="h-12 w-12 text-red-500" />
  );

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">{icon || defaultIcon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {!isOnline && (
        <div className="mb-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          <WifiOff className="h-4 w-4" />
          <span>لا يوجد اتصال بالإنترنت</span>
        </div>
      )}
      {onRetry && (
        <RetryButton
          onRetry={onRetry}
          retryText={retryText}
          size="lg"
          variant="primary"
        />
      )}
    </div>
  );
}

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Show spinner */
  showSpinner?: boolean;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading state component
 */
export function LoadingState({
  message = 'جارٍ التحميل...',
  showSpinner = true,
  size = 'md',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {showSpinner && (
        <svg
          className={`animate-spin ${sizeClasses[size]} text-blue-600 mb-4`}
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

export interface RetryableContentProps<T> {
  /** Fetch function that returns data */
  fetchData: () => Promise<T>;
  /** Render function for successful data */
  children: (data: T) => React.ReactNode;
  /** Loading state component */
  loadingComponent?: React.ReactNode;
  /** Error state component */
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
  /** Dependencies to re-fetch */
  deps?: React.DependencyList;
}

/**
 * Component that handles loading, error, and retry states automatically
 */
export function RetryableContent<T>({
  fetchData,
  children,
  loadingComponent,
  errorComponent,
  deps = [],
}: RetryableContentProps<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData, ...deps]);

  if (loading) {
    return loadingComponent || <LoadingState />;
  }

  if (error) {
    return errorComponent ? (
      errorComponent(error, loadData)
    ) : (
      <ErrorState
        description={error.message}
        onRetry={loadData}
      />
    );
  }

  if (!data) {
    return <ErrorState description="لا توجد بيانات" />;
  }

  return <>{children(data)}</>;
}
