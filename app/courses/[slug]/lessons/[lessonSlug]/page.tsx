 'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Download, BookOpen, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '../../../../components/Footer';
import AnimatedBackground from '../../../../components/AnimatedBackground';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    caption?: string;
  }>;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  totalLessons: number;
  lessons: Lesson[];
}

interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
  watchedTime: number;
  completedAt?: string;
}

interface Enrollment {
  id: string;
  progress: number;
  isCompleted: boolean;
  lessonProgress: LessonProgress[];
}

interface EnrolledCourseFromAPI {
  id: string;
  progress: {
    percentage: number;
  };
  isCompleted: boolean;
  lessons: Array<{
    id: string;
    isCompleted: boolean;
    watchedTime: number;
    completedAt?: string;
  }>;
}

export default function CourseLessonPage({ params }: { params: Promise<{ slug: string; lessonSlug: string }> }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [courseSlug, setCourseSlug] = useState<string>('');
  const [lessonSlug, setLessonSlug] = useState<string>('');
  const [watchTime, setWatchTime] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params;
      setCourseSlug(resolvedParams.slug);
      setLessonSlug(resolvedParams.lessonSlug);
    }
    initializeParams();
  }, [params]);

  useEffect(() => {
    // Check authentication status using auth store
    const { isAuthenticated: authIsAuthenticated } = useAuthStore.getState();
    setIsAuthenticated(authIsAuthenticated);
  }, []);

  useEffect(() => {
    if (!courseSlug || !lessonSlug) return;

    async function fetchCourseAndLesson() {
      try {
        // Fetch course data
        const courseResponse = await fetch(`/api/courses/${courseSlug}`);
        if (!courseResponse.ok) {
          throw new Error('Course not found');
        }
        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Find current lesson by slug first, then by ID if slug fails
        let lesson = courseData.lessons.find((l: Lesson) => l.slug === lessonSlug);
        if (!lesson) {
          // Try to find by ID
          lesson = courseData.lessons.find((l: Lesson) => l.id === lessonSlug);
        }
        if (!lesson) {
          throw new Error('Lesson not found');
        }
        setCurrentLesson(lesson);

        // Fetch enrollment and progress if authenticated
        if (isAuthenticated) {
          const token = useAuthStore.getState().token;
          if (token) {
            // Use the profile API which includes detailed enrollment data
            const profileResponse = await fetch('/api/user/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const userEnrollment = profileData.learningProfile?.enrolledCourses?.find((e: EnrolledCourseFromAPI) => e.id === courseData.id);
              
              if (userEnrollment) {
                // Transform the data to match our interface
                const enrollment = {
                  id: userEnrollment.id,
                  progress: userEnrollment.progress?.percentage || 0,
                  isCompleted: userEnrollment.isCompleted || false,
                  lessonProgress: userEnrollment.lessons?.map((lesson: { id: string; isCompleted?: boolean; watchedTime?: number; completedAt?: string }) => ({
                    lessonId: lesson.id,
                    isCompleted: lesson.isCompleted || false,
                    watchedTime: lesson.watchedTime || 0,
                    completedAt: lesson.completedAt
                  })) || []
                };
                setEnrollment(enrollment);
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }

    fetchCourseAndLesson();
  }, [courseSlug, lessonSlug, isAuthenticated]);

  const markLessonComplete = async () => {
    if (!currentLesson || !isAuthenticated || !course) return;

    try {
      const token = useAuthStore.getState().token;
      if (!token) return;

      const response = await fetch(`/api/courses/progress/${currentLesson.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          watchedTime: watchTime,
          isCompleted: true
        })
      });

      if (response.ok) {
        // Update local state
        if (enrollment) {
          const updatedProgress = enrollment.lessonProgress.map(p =>
            p.lessonId === currentLesson.id
              ? { ...p, isCompleted: true, watchedTime: watchTime, completedAt: new Date().toISOString() }
              : p
          );
          
          // If this lesson progress didn't exist, add it
          const existingProgress = enrollment.lessonProgress.find(p => p.lessonId === currentLesson.id);
          if (!existingProgress) {
            updatedProgress.push({
              lessonId: currentLesson.id,
              isCompleted: true,
              watchedTime: watchTime,
              completedAt: new Date().toISOString()
            });
          }
          
          setEnrollment({ ...enrollment, lessonProgress: updatedProgress });
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to mark lesson complete:', errorData);
        alert('فشل في وضع علامة الإكمال على الدرس. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
      alert('حدث خطأ أثناء وضع علامة الإكمال على الدرس.');
    }
  };

  const navigateToLesson = (targetLesson: Lesson) => {
    router.push(`/courses/${courseSlug}/lessons/${targetLesson.id}`);
  };

  const getNextLesson = () => {
    if (!course || !currentLesson) return null;
    const currentIndex = course.lessons.findIndex(l => l.id === currentLesson.id);
    return currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;
  };

  const getPreviousLesson = () => {
    if (!course || !currentLesson) return null;
    const currentIndex = course.lessons.findIndex(l => l.id === currentLesson.id);
    return currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  };

  const getLessonProgress = (lessonId: string) => {
    return enrollment?.lessonProgress?.find(p => p.lessonId === lessonId);
  };

  const calculateCourseProgress = () => {
    if (!course || !enrollment) return 0;
    const completedLessons = enrollment.lessonProgress.filter(p => p.isCompleted).length;
    return Math.round((completedLessons / course.totalLessons) * 100);
  };

  if (loading) {
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
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full relative z-10"
        />
      </div>
    );
  }

  if (error || !course || !currentLesson) {
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
        
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">خطأ في تحميل الدرس</h1>
          <p className="text-white/80 mb-4">{error}</p>
          <Link href={`/courses/${courseSlug}`} className="text-secondary-400 hover:text-secondary-300 transition-colors duration-200">
            العودة إلى الدورة
          </Link>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();
  const currentProgress = getLessonProgress(currentLesson.id);
  const courseProgress = calculateCourseProgress();

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      {/* Header */}
      <section className="relative z-10 pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/courses/${courseSlug}`}
              className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة إلى الدورة
            </Link>

            {/* Course Progress */}
            <div className="flex items-center gap-4">
              <div className="text-white text-sm">
                التقدم: {courseProgress}%
              </div>
              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {course.title}
            </h1>
            <h2 className="text-xl md:text-2xl text-secondary-400 mb-4">
              {currentLesson.title}
            </h2>
            <div className="flex items-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>الدرس {currentLesson.order} من {course.totalLessons}</span>
              </div>
              {currentProgress?.isCompleted && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>مكتمل</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Lesson Content */}
            <div className="lg:col-span-3">
              {/* Video Player */}
              {currentLesson.videoUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
                    <div className="relative aspect-video">
                      {currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                        <iframe
                          src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                          className="w-full h-full"
                          allowFullScreen
                          title={currentLesson.title}
                        />
                      ) : (
                        <video
                          src={currentLesson.videoUrl}
                          controls
                          className="w-full h-full"
                          onTimeUpdate={(e) => setWatchTime(Math.floor(e.currentTarget.currentTime))}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Lesson Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 mb-8"
              >
                <h3 className="text-2xl font-bold text-white mb-6">محتوى الدرس</h3>
                <div
                  className="prose prose-invert max-w-none text-white/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />
              </motion.div>

              {/* Attachments */}
              {currentLesson.images && currentLesson.images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 mb-8"
                >
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    المرفقات والموارد
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentLesson.images.map((image) => (
                      <div
                        key={image.id}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <FileText className="w-8 h-8 text-secondary-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{image.alt || image.caption || 'مرفق'}</h4>
                          <p className="text-white/60 text-sm">
                            مرفق
                          </p>
                        </div>
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          عرض
                        </a>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Lesson Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  {previousLesson && (
                    <button
                      onClick={() => navigateToLesson(previousLesson)}
                      className="flex items-center gap-3 px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      الدرس السابق
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  {!currentProgress?.isCompleted && isAuthenticated && (
                    <motion.button
                      onClick={markLessonComplete}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                    >
                      <CheckCircle className="w-5 h-5" />
                      اكتمل الدرس
                    </motion.button>
                  )}

                  {nextLesson && (
                    <button
                      onClick={() => navigateToLesson(nextLesson)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full font-semibold shadow-lg hover:shadow-primary-500/25 transition-all duration-300"
                    >
                      الدرس التالي
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar - Course Navigation */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 sticky top-24"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  دروس الدورة
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {course.lessons.map((lesson) => {
                    const lessonProgress = getLessonProgress(lesson.id);
                    const isCurrentLesson = lesson.id === currentLesson.id;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => navigateToLesson(lesson)}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                          isCurrentLesson
                            ? 'bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border-primary-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              lessonProgress?.isCompleted 
                                ? 'bg-green-500 text-white' 
                                : isCurrentLesson
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white/20 text-white/60'
                            }`}>
                              {lessonProgress?.isCompleted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <span>{lesson.order}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm leading-tight">{lesson.title}</h4>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
