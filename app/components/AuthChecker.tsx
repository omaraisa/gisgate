'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function AuthChecker() {
  const { checkAuth, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const performAuthCheck = async () => {
      try {
        const isValid = await checkAuth();
        
        if (!mounted) return;

        // Only redirect if we're certain about the auth state
        if (!isValid && !isLoading) {
          // Clear any auth-related query parameters that might cause loops
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.has('auth-redirect')) {
            currentUrl.searchParams.delete('auth-redirect');
            window.history.replaceState({}, '', currentUrl.toString());
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    // Only perform auth check if we have a token but no user data
    const token = useAuthStore.getState().token;
    if (token && !user && !isLoading) {
      performAuthCheck();
    }

    return () => {
      mounted = false;
    };
  }, [checkAuth, user, isLoading, router]);

  // This component doesn't render anything
  return null;
}