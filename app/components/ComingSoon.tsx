'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function ComingSoon() {
  // Hide the global header while this page is mounted
  useEffect(() => {
    try {
      document.body.classList.add('no-header');
    } catch (e) {
      // ignore in non-browser environments
    }

    return () => {
      try {
        document.body.classList.remove('no-header');
      } catch (e) {
        // ignore
      }
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-800 to-primary-900 flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span
              className="font-extrabold text-white drop-shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ADD900 0%, #8BB500 50%, #699100 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(173, 217, 0, 0.5)'
              }}
            >
              بوابة نظم
            </span>
            <br />
            <span
              className="font-extrabold text-white drop-shadow-lg text-4xl md:text-6xl"
              style={{
                color: '#FFFFFF',
                textShadow: '0 0 20px rgba(41, 63, 40, 0.8), 0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              المعلومات الجغرافية
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-8"
          >
            <div className="inline-block px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
              <span className="text-2xl md:text-3xl font-bold text-white">
                شيء مذهل قادم قريباً
              </span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed"
          >
            Something Amazing is Coming Soon
          </motion.p>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-secondary-400 to-secondary-500 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -10, 10, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full opacity-20 blur-xl"
        />
      </div>
    </div>
  );
}