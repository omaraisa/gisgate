'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AnimatedBackground from './components/AnimatedBackground';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Desktop Animated Background */}
      <div className="hidden md:block">
        <AnimatedBackground />
      </div>

      {/* Mobile Lightweight Background */}
      <div className="block md:hidden absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-700/60 to-primary-600/40"></div>
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-secondary-400/20 to-secondary-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-8 w-24 h-24 bg-gradient-to-br from-primary-400/25 to-primary-500/25 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-secondary-600/15 to-secondary-700/15 rounded-full blur-2xl"></div>
      </div>

      {/* Parallax effect element */}
      <motion.div
        className="hidden md:block absolute pointer-events-none"
        style={{
          left: mousePosition.x - 100,
          top: mousePosition.y - 100,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-[200px] h-[200px] bg-secondary-400/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* 404 Number with Glitch Effect */}
          <motion.div
            className="relative inline-block mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="text-[12rem] md:text-[18rem] font-bold leading-none">
              <span className="relative inline-block">
                <span className="absolute inset-0 text-secondary-400 opacity-50 blur-sm">404</span>
                <span className="absolute inset-0 text-secondary-400 animate-pulse">404</span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-b from-secondary-400 to-secondary-600">
                  404
                </span>
              </span>
            </div>

            {/* Decorative Elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-8 h-8 border-2 border-secondary-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary-400/30 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Arabic Title */}
          <motion.h1
            className="text-3xl md:text-5xl font-bold mb-4 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="inline-block bg-gradient-to-r from-foreground to-foreground-secondary bg-clip-text text-transparent">
              الصفحة غير موجودة
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-foreground-muted mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها. جرّب العودة إلى الصفحة الرئيسية أو استخدم القائمة للتنقل.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Primary Button - Home */}
            <Link href="/">
              <motion.button
                className="group relative px-8 py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-background font-bold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/50 min-w-[200px]"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <i className="fas fa-home"></i>
                  <span>الصفحة الرئيسية</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-secondary-400 to-secondary-500"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>

            {/* Secondary Button - Courses */}
            <Link href="/courses">
              <motion.button
                className="group relative px-8 py-4 bg-surface-elevated text-foreground font-bold rounded-lg border-2 border-primary-400 overflow-hidden transition-all duration-300 hover:border-secondary-400 hover:shadow-lg hover:shadow-primary-400/30 min-w-[200px]"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <i className="fas fa-book"></i>
                  <span>تصفح الدورات</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>
          </motion.div>

          {/* Additional Links */}
          <motion.div
            className="mt-12 flex flex-wrap gap-6 justify-center text-foreground-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link 
              href="/articles" 
              className="hover:text-secondary-400 transition-colors duration-200 flex items-center gap-2"
            >
              <i className="fas fa-newspaper text-sm"></i>
              <span>المقالات</span>
            </Link>
            <Link 
              href="/marketplace" 
              className="hover:text-secondary-400 transition-colors duration-200 flex items-center gap-2"
            >
              <i className="fas fa-store text-sm"></i>
              <span>المتجر</span>
            </Link>
            <Link 
              href="/about" 
              className="hover:text-secondary-400 transition-colors duration-200 flex items-center gap-2"
            >
              <i className="fas fa-info-circle text-sm"></i>
              <span>من نحن</span>
            </Link>
          </motion.div>

          {/* Decorative Bottom Element */}
          <motion.div
            className="mt-16 flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-secondary-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-[20%] w-16 h-16 border-2 border-secondary-400/30 rounded-lg"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-32 left-[15%] w-12 h-12 border-2 border-primary-400/30 rounded-full"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-[40%] left-[10%] w-8 h-8 bg-secondary-400/20 rotate-45"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
}
