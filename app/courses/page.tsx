'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode, useEffect, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import AddToCartButton from '../components/AddToCartButton';
import { Course } from '@/lib/stores/course-store';

interface CoursesResponse {
  courses: Course[];
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

export default function CoursesPage() {
  const [data, setData] = useState<CoursesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/courses?status=PUBLISHED&limit=20');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const coursesData = await response.json();
        setData(coursesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
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
          <h1 className="text-2xl font-bold text-white mb-4">خطأ في تحميل الدورات</h1>
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
                دورات
              </span>
              <br />
              <span
                className="font-extrabold text-white drop-shadow-lg"
                style={{
                  color: '#FFFFFF',
                  textShadow: '0 0 20px rgba(41, 63, 40, 0.8), 0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                التعلم
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
                  'اكتشف دورات شاملة في نظم المعلومات الجغرافية',
                  2000,
                  'تعلم من خبراء المجال والتقنيات المتقدمة',
                  2000,
                  'ابدأ رحلتك في التعلم المستمر والتطوير المهني',
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

      {/* Courses Section */}
      <div className="relative z-10 bg-transparent">
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                جميع الدورات
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full"></div>
            </MotionCard>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.courses.map((course, index) => (
                <MotionCard key={index} delay={index * 0.1}>
                  <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300 overflow-hidden">
                    {/* Featured Image - Clickable */}
                    {course.featuredImage && (
                      <Link href={`/courses/${course.slug}`}>
                        <div className="relative h-48 overflow-hidden rounded-t-2xl">
                          <motion.img
                            src={course.featuredImage}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold rounded-full">
                              {course.category || 'دورة'}
                            </span>
                            <span className={`px-3 py-1 text-white text-xs font-semibold rounded-full ${
                              course.level === 'BEGINNER' ? 'bg-green-500' :
                              course.level === 'INTERMEDIATE' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                              {course.level === 'BEGINNER' ? 'مبتدئ' :
                               course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                            </span>
                          </div>
                          {!course.isFree && (
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                                {course.price} {course.currency}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Content - Clickable */}
                    <Link href={`/courses/${course.slug}`}>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-secondary-300 transition-colors">
                          {course.title}
                        </h3>

                        {course.excerpt && (
                          <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-2">
                            {course.excerpt}
                          </p>
                        )}

                        {/* Course Meta */}
                        <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                          <div className="flex items-center gap-4">
                            {course.totalLessons > 0 && (
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{course.totalLessons} درس</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration || 'غير محدد'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Add to Cart Button - Outside Link */}
                    <div className="px-6 pb-6">
                      <AddToCartButton
                        course={course}
                        variant="primary"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  </FloatingCard>
                </MotionCard>
              ))}
            </div>

            {/* Empty State */}
            {data.courses.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-20"
              >
                <h2 className="text-2xl font-bold text-white mb-4">لا توجد دورات حالياً</h2>
                <p className="text-white/70">سيتم إضافة الدورات قريباً</p>
              </motion.div>
            )}

            {/* Stats */}
            {data.courses.length > 0 && (
              <MotionCard className="text-center mt-12" delay={0.8}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300"
                >
                  عرض {data.courses.length} من أصل {data.pagination.total} دورة
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