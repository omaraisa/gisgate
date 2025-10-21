'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Users, Star, Play, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import Footer from '../../components/Footer';
import AnimatedBackground from '../../components/AnimatedBackground';
import PayPalButton from '../../components/PayPalButton';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCourseStore } from '@/lib/stores/course-store';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  level: string;
  language: string;
  price?: number;
  currency?: string;
  isFree: boolean;
  duration?: string;
  totalLessons: number;
  publishedAt?: string;
  authorName?: string;
  authorAvatar?: string;
  enrollmentCount: number;
  lessons: Array<{
    id: string;
    title: string;
    slug: string;
    duration?: string;
  }>;
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  completedAt?: string;
  isCompleted: boolean;
  progress: {
    percentage: number;
    completedLessons: number;
    totalLessons: number;
    totalWatchTime: number;
  };
  lessonProgress: Array<{
    id: string;
    lessonId: string;
    watchedTime: number;
    isCompleted: boolean;
    completedAt?: string;
    lastWatchedAt: string;
    lesson: {
      id: string;
      title: string;
      slug: string;
      duration?: string;
      order: number;
    };
  }>;
  certificates: Array<{
    id: string;
    certificateId: string;
    templateName: string;
    language: string;
    earnedAt: string;
  }>;
}

export default function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  // Use auth store
  const { isAuthenticated, user } = useAuthStore();
  const { enrollInCourse, fetchEnrollments, enrollments } = useCourseStore();

  // Get enrollment for this course
  const enrollment = enrollments.find(e => e.id === course?.id) || null;

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function fetchCourse() {
      try {
        const response = await fetch(`/api/courses/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }
        const courseData = await response.json();
        setCourse(courseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    async function fetchEnrollment() {
      if (!isAuthenticated) return;

      try {
        await fetchEnrollments();
        // The enrollment will be updated in the course store
        // We can get it from the store or refetch if needed
      } catch (err) {
        console.error('Failed to fetch enrollment:', err);
      }
    }

    fetchCourse();
    if (isAuthenticated) {
      fetchEnrollment();
    }
  }, [slug, isAuthenticated, fetchEnrollments]);

  const handleEnroll = async () => {
    if (!course) return;

    if (!isAuthenticated) {
      // Redirect to login or show login prompt
      alert('يجب تسجيل الدخول أولاً للتسجيل في الدورة');
      window.location.href = '/auth';
      return;
    }

    setEnrolling(true);
    try {
      const success = await enrollInCourse(course.id);
      if (success) {
        alert('تم التسجيل في الدورة بنجاح!');
        // The course store already refreshes enrollments internally
      } else {
        alert('فشل في التسجيل في الدورة');
      }
    } catch (err) {
      setError('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const downloadCertificate = async (language: 'ar' | 'en') => {
    if (!enrollment || !course) return;

    try {
      const { token } = useAuthStore.getState();
      
      // First, let's find the correct enrollment ID by querying the user's enrollments
      const profileResponse = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile');
      }
      
      const profileData = await profileResponse.json();
      const userEnrollment = profileData.learningProfile?.enrolledCourses?.find((e: any) => e.id === course.id);
      
      if (!userEnrollment) {
        throw new Error('Enrollment not found');
      }
      
      // Use a direct enrollment lookup approach
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          courseId: course.id,  // Send course ID instead of enrollment ID
          language: language
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
      } else {
        const errorData = await response.json();
        console.error('Certificate download error:', errorData);
        alert(`فشل في تحميل الشهادة: ${errorData.error || 'خطأ غير معروف'}`);
      }
    } catch (err) {
      console.error('Certificate download error:', err);
      alert('فشل في تحميل الشهادة');
    }
  };

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

  if (error || !course) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">خطأ في تحميل الدورة</h1>
          <Link href="/courses" className="text-secondary-400 hover:text-secondary-300 transition-colors duration-200">
            العودة إلى الدورات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <section className="relative z-10 pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى الدورات
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold rounded-full">
                  {course.category || 'دورة'}
                </span>
                <span className={`px-3 py-1 text-white text-sm font-semibold rounded-full ${
                  course.level === 'BEGINNER' ? 'bg-green-500' :
                  course.level === 'INTERMEDIATE' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {course.level === 'BEGINNER' ? 'مبتدئ' :
                   course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                </span>
                {course.isFree && (
                  <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                    مجاني
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                {course.title}
              </h1>

              {course.excerpt && (
                <p className="text-xl text-white/90 mb-6 leading-relaxed">
                  {course.excerpt}
                </p>
              )}

              {/* Course Stats */}
              <div className="flex flex-wrap gap-6 mb-8 text-white/80">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.enrollmentCount} طالب</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  <span>{course.totalLessons} درس</span>
                </div>
                {course.publishedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(course.publishedAt).toLocaleDateString('en-US')}</span>
                  </div>
                )}
              </div>

              {/* Enrollment/Purchase Button */}
              <div className="flex flex-col gap-4">
                {enrollment ? (
                  <>
                    {enrollment.isCompleted ? (
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl flex items-center gap-2"
                        >
                          <CheckCircle className="w-6 h-6" />
                          تم إكمال الدورة 🎉
                        </motion.div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => downloadCertificate('ar')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                          >
                            📜 شهادة عربية
                          </motion.button>
                          <motion.button
                            onClick={() => downloadCertificate('en')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                          >
                            📜 English Certificate
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => {
                          // Find the first incomplete lesson or just go to first lesson
                          const firstIncompleteLesson = course.lessons.find(lesson => {
                            const lessonProgress = enrollment?.lessonProgress?.find(lp => lp.lessonId === lesson.id);
                            return !lessonProgress?.isCompleted;
                          });
                          
                          // If no incomplete lesson found (all complete or no progress), go to first lesson
                          const targetLesson = firstIncompleteLesson || course.lessons[0];
                          
                          if (targetLesson) {
                            window.location.href = `/courses/${course.slug}/lessons/${targetLesson.id}`;
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                      >
                        متابعة الدورة ({Math.round((enrollment.progress as any).percentage || 0)}%)
                      </motion.button>
                    )}
                  </>
                ) : course.isFree ? (
                  <motion.button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'جاري التسجيل...' : 'التسجيل مجاناً'}
                  </motion.button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {course.price} {course.currency}
                      </div>
                      <div className="text-white/80">
                        دورة مدفوعة - ادفع مرة واحدة واستمتع بالوصول مدى الحياة
                      </div>
                    </div>

                    {!isAuthenticated ? (
                      <div className="text-center space-y-3">
                        <div className="text-white/80 mb-4">
                          يجب تسجيل الدخول أولاً لشراء الدورة
                        </div>
                        <Link
                          href="/auth"
                          className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300"
                        >
                          تسجيل الدخول / إنشاء حساب
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}/checkout`}
                        className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300 text-center"
                      >
                        شراء الدورة
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Course Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {course.featuredImage && (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={course.featuredImage}
                    alt={course.title}
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Lessons List */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-white mb-8">محتوى الدورة</h2>

              <div className="space-y-6">
            {course.lessons.map((lesson, index) => {
              const isCompleted = enrollment?.lessonProgress?.find(p => p.lessonId === lesson.id)?.isCompleted;
              const isLocked = !enrollment && !course.isFree && isAuthenticated;

              if (isLocked) {
                return (
                  <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl border border-white/20 bg-white/5 cursor-not-allowed backdrop-blur-md transition-all duration-300 mb-4"
                  >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-500">
                              <Lock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-400">
                                {index + 1}. {lesson.title}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={enrollment ? `/courses/${course.slug}/lessons/${lesson.id}` : '#'}
                      onClick={(e) => {
                        if (!enrollment) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer backdrop-blur-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted ? 'bg-green-500' : 'bg-secondary-500'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                              ) : (
                                <Play className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">
                                {index + 1}. {lesson.title}
                              </h3>
                            </div>
                          </div>

                          {isLocked ? (
                            <Lock className="w-5 h-5 text-white/40" />
                          ) : (
                            <div className="text-secondary-400 hover:text-secondary-300 text-sm font-medium">
                              مشاهدة الدرس →
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Course Details Sidebar */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">تفاصيل الدورة</h3>

                <div className="space-y-3 text-white/80">
                  <div className="flex justify-between">
                    <span>المستوى:</span>
                    <span className="font-semibold">
                      {course.level === 'BEGINNER' ? 'مبتدئ' :
                       course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>اللغة:</span>
                    <span className="font-semibold">
                      {course.language === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>عدد الدروس:</span>
                    <span className="font-semibold">{course.totalLessons}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>عدد الطلاب:</span>
                    <span className="font-semibold">{course.enrollmentCount}</span>
                  </div>
                </div>
              </div>

              {/* Course Description */}
              {course.description && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">وصف الدورة</h3>
                  <div
                    className="text-white/80 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}