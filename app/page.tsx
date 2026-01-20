'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth-store';
import HomePage from './components/Home';
import ComingSoon from './components/ComingSoon';
import AuthChecker from './components/AuthChecker';
import AnimatedBackground from './components/AnimatedBackground';

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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Desktop Animated Background */}
        <div className="hidden md:block">
          <AnimatedBackground />
        </div>
        
        {/* Mobile Lightweight Background */}
        <div className="block md:hidden absolute inset-0 z-0">
          {/* Gradient Background using brand colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-700/60 to-primary-600/40"></div>
          
          {/* Static Geometric Shapes using brand colors */}
          <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-secondary-400/20 to-secondary-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-8 w-24 h-24 bg-gradient-to-br from-primary-400/25 to-primary-500/25 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-secondary-600/15 to-secondary-700/15 rounded-full blur-2xl"></div>
          
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mobile-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="1" fill="rgba(173, 217, 0, 0.3)"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mobile-grid)"/>
            </svg>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full"
          />
          <div className="text-white text-xl">جاري التحميل...</div>
        </div>
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
