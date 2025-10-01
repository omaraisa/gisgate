'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode, useEffect, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Calendar, Eye, Play } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  publishedAt?: string;
  viewCount: number;
  duration?: string;
}

interface LessonsResponse {
  lessons: Lesson[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const MotionCard = ({ children, className = "", delay = 0 }: MotionCardProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
}

const FloatingCard = ({ children, className = "" }: FloatingCardProps) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

export default function LessonsPage() {
  const [data, setData] = useState<LessonsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons?status=PUBLISHED&limit=20');
        if (!response.ok) {
          throw new Error('Failed to fetch lessons');
        }
        const lessonsData = await response.json();
        setData(lessonsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full relative z-10"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">خطأ في تحميل الدروس</h1>
          <Link href="/" className="text-secondary-400 hover:text-secondary-300 transition-colors duration-200">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
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
                دروس
              </span>
              <br />
              <span
                className="font-extrabold text-white drop-shadow-lg"
                style={{
                  color: '#FFFFFF',
                  textShadow: '0 0 20px rgba(41, 63, 40, 0.8), 0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                البوابة
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-8"
          >
            <div className="text-xl md:text-2xl text-foreground-secondary h-20">
              <TypeAnimation
                sequence={[
                  'اكتشف أحدث الدروس التعليمية في نظم المعلومات الجغرافية',
                  2000,
                  'تعلم من خلال الفيديوهات التفاعلية والشروحات المفصلة',
                  2000,
                  'ابدأ رحلتك التعليمية مع أفضل المحتوى التعليمي',
                  2000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lessons Section */}
      <div className="relative z-10 bg-transparent">
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                جميع الدروس
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full"></div>
            </MotionCard>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.lessons.map((lesson, index) => (
            <MotionCard key={index} delay={index * 0.1}>
              <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                <Link href={`/lessons/${lesson.slug}`}>
                  {/* Featured Image */}
                  {lesson.featuredImage && (
                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                      <motion.img
                        src={lesson.featuredImage}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
                        >
                          <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                        </motion.div>
                      </div>

                      {lesson.category && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                            🎥 {lesson.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-secondary-300 transition-colors">
                      {lesson.title}
                    </h3>

                    {lesson.excerpt && (
                      <p className="text-white/90 text-sm leading-relaxed mb-4">
                        {lesson.excerpt}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-white/60">
                      <div className="flex items-center gap-4">
                        {lesson.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(lesson.publishedAt), 'dd MMM yyyy')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{lesson.viewCount}</span>
                        </div>

                        {lesson.duration && (
                          <div className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            <span>{lesson.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      className="h-1 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mt-4"
                    />
                  </div>
                </Link>
              </FloatingCard>
            </MotionCard>
          ))}
        </div>

        {/* Empty State */}
        {data.lessons.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <h2 className="text-2xl font-bold text-white mb-4">لا توجد دروس حالياً</h2>
            <p className="text-white/70">سيتم إضافة الدروس قريباً</p>
          </motion.div>
        )}

        {/* Stats */}
        {data.lessons.length > 0 && (
          <MotionCard className="text-center mt-12" delay={0.8}>
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300"
            >
              عرض {data.lessons.length} من أصل {data.pagination.total} درس
            </motion.button>
          </MotionCard>
        )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}