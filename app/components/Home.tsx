'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Globe, Zap, Users, BookOpen, Sparkles, ArrowRight, Play, FileText } from 'lucide-react';

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

export default function Home() {

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/40 to-slate-900"></div>
      </div>



      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                بوابة نظم
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
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
            <div className="text-2xl md:text-3xl text-gray-300 h-20">
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
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full text-lg shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                ابدأ التعلم الآن
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, rotateX: -10 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-full text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
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
          className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 blur-xl"
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
          className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"
        />
      </section>

      {/* Content Sections */}
      <div className="relative z-10 bg-gradient-to-b from-transparent to-slate-900/95">
        {/* Watch a Lesson Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                شاهد درساً
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videoPosts.map((post, index) => (
                <MotionCard key={index} delay={index * 0.1}>
                  <FloatingCard className="group bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 h-full cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white"
                      >
                        {post.icon}
                      </motion.div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors">
                      {post.title}
                    </h3>
                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                    />
                  </FloatingCard>
                </MotionCard>
              ))}
            </div>

            <MotionCard className="text-center mt-12" delay={0.8}>
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
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
              <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                أو اقرأ مقالة
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articlePosts.map((post, index) => (
                <MotionCard key={index} delay={index * 0.1}>
                  <FloatingCard className="group bg-gradient-to-br from-slate-800/80 to-cyan-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 h-full cursor-pointer">
                    <a href={post.link}>
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div
                          whileHover={{ rotate: -360 }}
                          transition={{ duration: 0.6 }}
                          className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white"
                        >
                          {post.icon}
                        </motion.div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-300 transition-colors">
                        {post.title}
                      </h3>
                      <motion.div
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                        className="h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                      />
                    </a>
                  </FloatingCard>
                </MotionCard>
              ))}
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

        {/* What the Portal Offers */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ما الذي تقدمه البوابة؟
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full"></div>
            </MotionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <MotionCard delay={0.3}>
                <FloatingCard className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl"
                    >
                      <BookOpen className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white">الدروس التقنية</h3>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    توفر البوابة باقة واسعة من الدروس التقنية مصحوبة بالبيانات الجغرافية والكتيبات
                    الإرشادية وشتى المعينات التدريبية لضمان تجربة تعليمية متكاملة وفعالة
                  </p>
                </FloatingCard>
              </MotionCard>

              <MotionCard delay={0.5}>
                <FloatingCard className="bg-gradient-to-br from-slate-800/80 to-blue-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl"
                    >
                      <Zap className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white">التطبيقات</h3>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    منصة جي بورتال عبارة عن تطبيق نظم معلومات جغرافية متعدد المهام يسمح للمستخدمين
                    بإضافة ورفع مختلف أنواع البيانات وإجراء العمليات المتقدمة عليها
                  </p>
                </FloatingCard>
              </MotionCard>
            </div>
          </div>
        </section>

        {/* Applications Showcase */}
        <ParallaxSection className="py-20 px-4" offset={30}>
          <div className="max-w-7xl mx-auto">
            <MotionCard className="text-center mb-16">
              <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                تطبيقات البوابة
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
            </MotionCard>

            <MotionCard delay={0.3}>
              <FloatingCard className="bg-gradient-to-br from-slate-800/90 to-green-900/90 backdrop-blur-xl border border-green-500/20 rounded-3xl p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <motion.h3 
                      className="text-4xl font-bold text-white mb-6 flex items-center gap-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🌍
                      </motion.span>
                      جي بورتال
                    </motion.h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-8">
                      منصة جي بورتال عبارة عن تطبيق نظم معلومات جغرافية متعدد المهام تم تطويره
                      ليسمح للمستخدمين بإضافة ورفع مختلف أنواع البيانات مثل الشيبفايل وملفات الإكسل
                      ومن ثم إجراء مختلف العمليات عليها كالاستكشاف، التحرير، الاستعلام، التحليل، الترميز
                      ومن ثم تصدير النتائج وطباعة الخرائط.
                    </p>
                    <motion.a 
                      href="https://rebrand.ly/gportal"
                      whileHover={{ scale: 1.05, rotateX: 10 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                    >
                      <Sparkles className="w-6 h-6" />
                      جرب الآن
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </motion.a>
                  </div>
                  <div className="relative">
                    <motion.div
                      whileHover={{ rotateY: 15, rotateX: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative"
                    >
                      <div className="w-full h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-green-400/30">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-6xl"
                        >
                          🗺️
                        </motion.div>
                      </div>
                      {/* Floating particles around the app preview */}
                      <motion.div
                        animate={{ 
                          y: [0, -20, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 4, repeat: Infinity, delay: 0 }}
                        className="absolute -top-4 -left-4 w-4 h-4 bg-green-400 rounded-full"
                      />
                      <motion.div
                        animate={{ 
                          y: [0, -15, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                        className="absolute -bottom-4 -right-4 w-3 h-3 bg-blue-400 rounded-full"
                      />
                      <motion.div
                        animate={{ 
                          y: [0, -25, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                        className="absolute top-1/2 -right-6 w-2 h-2 bg-cyan-400 rounded-full"
                      />
                    </motion.div>
                  </div>
                </div>
              </FloatingCard>
            </MotionCard>
          </div>
        </ParallaxSection>
      </div>
    </div>
  );
}
