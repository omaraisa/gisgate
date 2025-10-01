'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useCourseStore } from '@/lib/stores/course-store';
import { usePaymentStore } from '@/lib/stores/payment-store';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  // Initialize stores to ensure they are created
  const { checkAuth } = useAuthStore();

  // Validate authentication on app startup
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

// Export all stores for easy access
export { useAuthStore } from '@/lib/stores/auth-store';
export { useUIStore } from '@/lib/stores/ui-store';
export { useCourseStore } from '@/lib/stores/course-store';
export { usePaymentStore } from '@/lib/stores/payment-store';