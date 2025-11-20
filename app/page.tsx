'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import HomePage from './components/Home';
import ComingSoon from './components/ComingSoon';
import AuthChecker from './components/AuthChecker';

export default function Home() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const performAuthCheck = async () => {
      await checkAuth();
      setHasCheckedAuth(true);
    };

    if (!hasCheckedAuth) {
      performAuthCheck();
    }
  }, [checkAuth, hasCheckedAuth]);

  // Show loading state while checking auth
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <>
      <AuthChecker />
      {isAuthenticated ? <HomePage /> : <ComingSoon />}
    </>
  );
}
