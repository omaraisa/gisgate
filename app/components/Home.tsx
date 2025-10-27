'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, ReactNode, useEffect, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Globe, Zap, Users, BookOpen, Sparkles, ArrowRight, Play, FileText } from 'lucide-react';
import Footer from './Footer';
import AnimatedBackground from './AnimatedBackground';
import PostCard from './PostCard';

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

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

const ParallaxSection = ({ children, className = "", offset = 50 }: ParallaxSectionProps) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  publishedAt?: string;
  viewCount: number;
  authorName?: string;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  publishedAt?: string;
  viewCount: number;
  authorName?: string;
  videoUrl?: string;
  duration?: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  publishedAt?: string;
  viewCount: number;
  authorName?: string;
  duration?: string;
  price?: number;
}

interface ArticlesResponse {
  articles: Article[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

interface CoursesResponse {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Solution {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  solutionType: string;
  category?: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  downloadCount: number;
}

interface SolutionsResponse {
  solutions: Solution[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [articlesResponse, lessonsResponse, coursesResponse, solutionsResponse] = await Promise.all([
          fetch('/api/articles?status=PUBLISHED&limit=3'),
          fetch('/api/lessons?status=PUBLISHED&limit=3'),
          fetch('/api/courses?status=PUBLISHED&limit=3'),
          fetch('/api/marketplace?status=PUBLISHED&limit=3')
        ]);

        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          setArticles(articlesData.articles);
        }

        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData.lessons);
        }

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.courses);
        }

        if (solutionsResponse.ok) {
          const solutionsData = await solutionsResponse.json();
          setSolutions(solutionsData.solutions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const videoPosts = [
    { title: 'تصميم الخرائط والتطبيقات على ArcGIS Online', link: '#', icon: <Globe className="w-6 h-6" /> },
    { title: 'تبويب المعرض، المجموعات والمحتويات في ArcGIS Online', link: '#', icon: <BookOpen className="w-6 h-6" /> },
    { title: 'تصميم خريطة ألغاز', link: '#', icon: <Sparkles className="w-6 h-6" /> },
    { title: 'إنشاء المشاهد ثلاثية الأبعاد في ArcGIS Online', link: '#', icon: <Zap className="w-6 h-6" /> },
    { title: 'كيف تستعمل الترميز الكمي والنوعي بطريقة خاطئة!', link: '#', icon: <Users className="w-6 h-6" /> },
    { title: 'مقدمة في ArcGIS Online', link: '#', icon: <Play className="w-6 h-6" /> },
  ];

  const articlePosts = [
    { title: 'الذكاء المكاني Location Intelligence', link: '#', icon: <Globe className="w-6 h-6" /> },
    { title: 'تكامل GIS مع الطائرات بدون طيار (الدرونز)', link: '#', icon: <Zap className="w-6 h-6" /> },
    { title: 'ألوان الخرائط', link: '#', icon: <Sparkles className="w-6 h-6" /> },
    { title: 'التوأم الرقمي Digital Twin', link: '/articles/digital-twin', icon: <Users className="w-6 h-6" /> },
    { title: 'إضافات ازري الجديدة للمطورين', link: '#', icon: <BookOpen className="w-6 h-6" /> },
    { title: 'خريطتك كما يراها أصحاب عمى الألوان', link: '#', icon: <FileText className="w-6 h-6" /> },
  ];

  const coursePosts = [
    { title: 'دورة ArcGIS Pro المتقدمة', link: '#', icon: <Globe className="w-6 h-6" />, duration: '40 ساعة', price: 299 },
    { title: 'تحليل البيانات المكانية مع Python', link: '#', icon: <Zap className="w-6 h-6" />, duration: '25 ساعة', price: 199 },
    { title: 'تصميم الخرائط الرقمية المتقدمة', link: '#', icon: <Sparkles className="w-6 h-6" />, duration: '30 ساعة', price: 249 },
    { title: 'إدارة قواعد البيانات الجغرافية', link: '#', icon: <BookOpen className="w-6 h-6" />, duration: '35 ساعة', price: 279 },
    { title: 'تطوير تطبيقات GIS على الويب', link: '#', icon: <Users className="w-6 h-6" />, duration: '45 ساعة', price: 349 },
    { title: 'تحليل الظواهر المكانية المتقدم', link: '#', icon: <FileText className="w-6 h-6" />, duration: '50 ساعة', price: 399 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-size-reduced">
      <AnimatedBackground />
      {/* Content Sections */}
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
                بوابة نظم
              </span>
              <br />
              <span 
                className="font-extrabold text-white drop-shadow-lg"
                style={{
                  color: '#FFFFFF',
                  textShadow: '0 0 20px rgba(41, 63, 40, 0.8), 0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                المعلومات الجغرافية
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
                  'منصة تعليمية شاملة لتعلم نظم المعلومات الجغرافية',
                  2000,
                  'تعلم ArcGIS وتطبيقاته المتقدمة',
                  2000,
                  'اكتشف عالم الخرائط الرقمية والتحليل المكاني',
                  2000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, rotateX: 10 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-secondary-600 to-secondary-500 text-primary-700 font-bold rounded-full text-lg shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-700 to-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                ابدأ التعلم الآن
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, rotateX: -10 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-foreground text-foreground font-bold rounded-full text-lg backdrop-blur-sm hover:bg-foreground/10 transition-all duration-300"
            >
              تصفح المحتوى
            </motion.button>
          </motion.div>
        </div>

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
      </section>

      {/* Content Sections */}
      <div className="relative z-10 bg-transparent">
        {/* Watch a Lesson Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                شاهد درساً
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full animate-pulse">
                      <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
                      <div className="h-6 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </MotionCard>
                ))
              ) : lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <MotionCard key={lesson.id} delay={index * 0.1}>
                    <PostCard
                      title={lesson.title}
                      excerpt={lesson.excerpt}
                      slug={lesson.slug}
                      publishedAt={lesson.publishedAt ? new Date(lesson.publishedAt) : null}
                      featuredImage={lesson.featuredImage}
                      authorName={lesson.authorName}
                      category={lesson.category}
                      type="video"
                    />
                  </MotionCard>
                ))
              ) : (
                // Fallback to sample data if no lessons
                videoPosts.slice(0, 3).map((post, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white"
                        >
                          {post.icon}
                        </motion.div>
                        <div className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse"></div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-secondary-300 transition-colors">
                        {post.title}
                      </h3>
                      <motion.div
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        className="h-1 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full"
                      />
                    </FloatingCard>
                  </MotionCard>
                ))
              )}
            </div>

            <MotionCard className="text-center mt-12" delay={0.8}>
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300"
              >
                تصفح المزيد &gt;&gt;
              </motion.button>
            </MotionCard>
          </div>
        </section>

        {/* Read an Article Section */}
        <ParallaxSection className="py-20 px-4" offset={-50}>
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                أو اقرأ مقالة
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full animate-pulse">
                      <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
                      <div className="h-6 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </MotionCard>
                ))
              ) : articles.length > 0 ? (
                articles.map((article, index) => (
                  <MotionCard key={article.id} delay={index * 0.1}>
                    <PostCard
                      title={article.title}
                      excerpt={article.excerpt}
                      slug={article.slug}
                      publishedAt={article.publishedAt ? new Date(article.publishedAt) : null}
                      featuredImage={article.featuredImage}
                      authorName={article.authorName}
                      category={article.category}
                      type="article"
                    />
                  </MotionCard>
                ))
              ) : (
                // Fallback to sample data if no articles
                articlePosts.slice(0, 3).map((post, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                      <a href={post.link}>
                        <div className="flex items-center gap-4 mb-4">
                          <motion.div
                            whileHover={{ rotate: -360 }}
                            transition={{ duration: 0.6 }}
                            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white"
                          >
                            {post.icon}
                          </motion.div>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-primary-300 transition-colors">
                          {post.title}
                        </h3>
                        <motion.div
                          initial={{ width: 0 }}
                          whileHover={{ width: "100%" }}
                          className="h-1 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full"
                        />
                      </a>
                    </FloatingCard>
                  </MotionCard>
                ))
              )}
            </div>

            <MotionCard className="text-center mt-12" delay={0.8}>
              <motion.a
                href="/articles"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300"
              >
                تصفح جميع المقالات &gt;&gt;
              </motion.a>
            </MotionCard>
          </div>
        </ParallaxSection>

        {/* Take a Course Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                أو خذ دورة تدريبية
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full animate-pulse">
                      <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
                      <div className="h-6 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </MotionCard>
                ))
              ) : courses.length > 0 ? (
                courses.map((course, index) => (
                  <MotionCard key={course.id} delay={index * 0.1}>
                    <PostCard
                      title={course.title}
                      excerpt={course.excerpt}
                      slug={course.slug}
                      publishedAt={course.publishedAt ? new Date(course.publishedAt) : null}
                      featuredImage={course.featuredImage}
                      authorName={course.authorName}
                      category={course.category}
                      type="course"
                    />
                  </MotionCard>
                ))
              ) : (
                // Fallback to sample data if no courses
                coursePosts.slice(0, 3).map((post, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          whileHover={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6 }}
                          className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white"
                        >
                          {post.icon}
                        </motion.div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-300 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                        <span className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {post.duration}
                        </span>
                        <span className="font-bold text-purple-400">${post.price}</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      />
                    </FloatingCard>
                  </MotionCard>
                ))
              )}
            </div>

            <MotionCard className="text-center mt-12" delay={0.8}>
              <motion.a
                href="/courses"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
              >
                تصفح جميع الدورات &gt;&gt;
              </motion.a>
            </MotionCard>
          </div>
        </section>

        {/* Marketplace Section */}
        <ParallaxSection className="py-20 px-4" offset={-50}>
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  أو تصفح متجر الحلول
                </span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <MotionCard key={index} delay={index * 0.1}>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full animate-pulse">
                      <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
                      <div className="h-6 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </MotionCard>
                ))
              ) : solutions.length > 0 ? (
                solutions.map((solution, index) => (
                  <MotionCard key={solution.id} delay={index * 0.1}>
                    <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                      <a href={`/marketplace/${solution.slug}`}>
                        {solution.featuredImage ? (
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={solution.featuredImage} 
                              alt={solution.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4">
                              {solution.isFree ? (
                                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                  مجاني
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                                  ${solution.price}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-48 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                              className="p-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white"
                            >
                              <Globe className="w-12 h-12" />
                            </motion.div>
                            <div className="absolute top-4 right-4">
                              {solution.isFree ? (
                                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                  مجاني
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                                  ${solution.price}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold rounded-full">
                              {solution.solutionType}
                            </span>
                            {solution.category && (
                              <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full">
                                {solution.category}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-secondary-300 transition-colors line-clamp-2">
                            {solution.title}
                          </h3>
                          {solution.excerpt && (
                            <p className="text-white/70 text-sm mb-4 line-clamp-3">
                              {solution.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm text-white/60 pt-4 border-t border-white/10">
                            <span className="flex items-center gap-1">
                              <ArrowRight className="w-4 h-4" />
                              {solution.downloadCount} تحميل
                            </span>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            whileHover={{ width: "100%" }}
                            className="h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-cyan-400 rounded-full mt-4"
                          />
                        </div>
                      </a>
                    </FloatingCard>
                  </MotionCard>
                ))
              ) : (
                // Empty state
                <MotionCard delay={0.2} className="col-span-full">
                  <div className="text-center py-12">
                    <Globe className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/70 text-lg">لا توجد حلول متاحة حالياً</p>
                    <p className="text-white/50 text-sm mt-2">سيتم إضافة الحلول قريباً</p>
                  </div>
                </MotionCard>
              )}
            </div>

            <MotionCard className="text-center mt-12" delay={0.8}>
              <motion.a
                href="/marketplace"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block bg-gradient-to-r from-orange-600 via-yellow-600 to-cyan-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-orange-500/25 transition-all duration-300"
              >
                تصفح جميع الحلول &gt;&gt;
              </motion.a>
            </MotionCard>
          </div>
        </ParallaxSection>

        {/* What the Portal Offers */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-secondary-400 to-primary-400 bg-clip-text text-transparent">
                ما الذي تقدمه البوابة؟
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-secondary-400 to-primary-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <MotionCard delay={0.3}>
                <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="p-4 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl"
                    >
                      <BookOpen className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white">الدروس التقنية</h3>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed">
                    توفر البوابة باقة واسعة من الدروس التقنية مصحوبة بالبيانات الجغرافية والكتيبات
                    الإرشادية وشتى المعينات التدريبية لضمان تجربة تعليمية متكاملة وفعالة
                  </p>
                </FloatingCard>
              </MotionCard>

              <MotionCard delay={0.5}>
                <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 h-full shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl"
                    >
                      <Zap className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white">الحلول الجيومكانية</h3>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed">
                    تشرف البوابة على تنفيذ وتطوير مختلف أنواع الحلول الجيومكانية من الإضافات على برنامج أرك برو، الأدوات التحليلية المعقدة وحتى المنصات الجيومكانية
                  </p>
                </FloatingCard>
              </MotionCard>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
