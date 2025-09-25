import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import PageHeader from './PageHeader';
import Footer from './Footer';
import AnimatedBackground from './AnimatedBackground';

interface ContentLayoutProps {
  children: ReactNode;
}

export default function ContentLayout({ children }: ContentLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <PageHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-background-secondary/50 backdrop-blur-lg border border-border rounded-2xl shadow-2xl p-8 md:p-12"
          >
            {children}
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
}