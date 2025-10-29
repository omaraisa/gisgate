'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import Footer from '@/app/components/Footer';
import { Globe, Target, BookOpen, Video, Award, Users, BarChart3, Mail, Linkedin } from 'lucide-react';

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

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden font-size-reduced">
      <AnimatedBackground />
      
      {/* About Section - Main Hero */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          <MotionCard className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                تعرف أكثر على البوابة
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full mb-8"></div>
              <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                منصتك الشاملة لتعلم نظم المعلومات الجغرافية باللغة العربية
              </p>
            </motion.div>
          </MotionCard>

          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            <MotionCard delay={0.2}>
              <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 h-full">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white mr-4">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">رؤيتنا</h2>
                </div>
                <p className="text-white/80 text-lg leading-relaxed">
                  تم إنشاء البوابة لإثراء المحتوى العربي في مجال نظم المعلومات الجغرافية بكل فروعه. 
                  كما تركز البوابة على إيصال المعلومات العلمية بأسلوب شيق وممتع بالإضافة إلى 
                  الاهتمام بربط الجانب العملي بالنظري.
                </p>
              </FloatingCard>
            </MotionCard>

            <MotionCard delay={0.4}>
              <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 h-full">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-xl text-white mr-4">
                    <Target className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">مهمتنا</h2>
                </div>
                <p className="text-white/80 text-lg leading-relaxed">
                  تمثل البوابة معبراً مناسباً لكل المبتدئين ممن يرغبون بتعلم نظم المعلومات الجغرافية 
                  وكذلك المتخصصين الذين يطمحون لرفع مهاراتهم التقنية بخطوات واضحة وبأسس علمية.
                </p>
              </FloatingCard>
            </MotionCard>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <MotionCard className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-secondary-400 to-primary-400 bg-clip-text text-transparent">
              أهداف البوابة
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-secondary-400 to-primary-400 mx-auto rounded-full"></div>
          </MotionCard>

          <MotionCard delay={0.3}>
            <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 mb-16">
              <p className="text-white/90 text-xl leading-relaxed text-center max-w-4xl mx-auto">
                تهدف البوابة إلى أن تكون المنصة الأولى في تعليم نظم المعلومات الجغرافية وذلك 
                بإتاحة مختلف وسائل التعلم في بؤرة واحدة تيسر من عملية التعليم الذاتي. 
                كما تهدف البوابة إلى زيادة الوعي بمجال نظم المعلومات الجغرافية وذلك بمساعدة 
                الأساتذة والمدربين في هذا المجال ومدهم بالمواد التدريبية والعروض التقديمية 
                والمقالات العلمية اللازمة حتى يسهل عليهم إيصال المعلومة إلى تلامذتهم.
              </p>
            </FloatingCard>
          </MotionCard>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <MotionCard className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              ما نقدمه لك
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full"></div>
          </MotionCard>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "دورات تدريبية", desc: "دورات شاملة ومتنوعة لتعلم مختلف مواضيع نظم المعلومات الجغرافية", delay: 0.1 },
              { icon: Globe, title: "مقالات علمية", desc: "مقالات متخصصة تغطي مختلف جوانب نظم المعلومات الجغرافية والتطبيقات العملية", delay: 0.6 },
              { icon: Video, title: "فيديوهات تعليمية", desc: "مكتبة شاملة من الفيديوهات التعليمية لشرح المفاهيم والتطبيقات العملية", delay: 0.2 },
              { icon: Award, title: "شهادات احترافية", desc: "احصل على شهادات احترافية عند إتمام الدورات التدريبية بنجاح", delay: 0.3 },
              { icon: Users, title: "مجتمع تفاعلي", desc: "انضم إلى مجتمع المتعلمين والخبراء لتبادل الخبرات والأسئلة", delay: 0.4 },
              { icon: BarChart3, title: "تطبيقات عملية", desc: "مشاريع وتطبيقات عملية لربط المفاهيم النظرية بالواقع العملي", delay: 0.5 }
            ].map((feature, index) => (
              <MotionCard key={index} delay={feature.delay}>
                <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center h-full group hover:bg-white/10 transition-all duration-500">
                  <div className="p-4 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl mb-4 inline-block">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-primary-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.desc}
                  </p>
                  <div 
                    className="h-1 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mt-4"
                    style={{ width: `${(index + 1) * 15}%` }}
                  ></div>
                </FloatingCard>
              </MotionCard>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="relative z-10 py-20 px-4 overflow-hidden">
        {/* Enhanced floating background elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large floating orbs */}
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-full blur-xl"
            animate={{
              y: [0, -50, 0],
              x: [0, 30, 0],
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-r from-secondary-400/25 to-primary-400/25 rounded-full blur-lg"
            animate={{
              y: [0, 40, 0],
              x: [0, -25, 0],
              scale: [1, 0.8, 1],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-lg"
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Geometric shapes */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-primary-400/30 rotate-45"
            animate={{
              rotate: [45, 225, 45],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-r from-secondary-400/25 to-primary-400/25 rounded-full"
            animate={{
              y: [0, -20, 0],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating particles trail */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${10 + (i * 4)}%`,
                top: `${20 + Math.sin(i * 0.5) * 30}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 4,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative">
          <MotionCard className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-secondary-400 to-primary-400 bg-clip-text text-transparent">
              من هو مطور البوابة؟
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-secondary-400 to-primary-400 mx-auto rounded-full"></div>
          </MotionCard>

          <MotionCard delay={0.2}>
            <FloatingCard className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 40% 60%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)
                  `
                }}></div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                {/* Image Section - Left */}
                <div className="flex flex-col items-center lg:col-span-1">
                  <motion.div
                    className="relative group"
                    whileHover={{ 
                      scale: 1.08,
                      rotateY: 15,
                      rotateX: 5
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 15,
                      duration: 0.6
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Outer glow ring */}
                    <motion.div
                      className="absolute -inset-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{
                        background: 'conic-gradient(from 0deg, #3B82F6, #8B5CF6, #EC4899, #F59E0B, #10B981, #3B82F6)',
                        filter: 'blur(20px)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Multiple rotating borders */}
                    <motion.div
                      className="absolute -inset-4 rounded-full opacity-60"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.6) 90deg, transparent 180deg, rgba(139, 92, 246, 0.6) 270deg, transparent 360deg)',
                        padding: '2px'
                      }}
                    >
                      <div className="w-full h-full bg-transparent rounded-full"></div>
                    </motion.div>
                    
                    <motion.div
                      className="absolute -inset-2 rounded-full opacity-40"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      style={{
                        background: 'conic-gradient(from 180deg, transparent 0deg, rgba(236, 72, 153, 0.4) 120deg, transparent 240deg, rgba(245, 158, 11, 0.4) 300deg, transparent 360deg)',
                        padding: '1px'
                      }}
                    >
                      <div className="w-full h-full bg-transparent rounded-full"></div>
                    </motion.div>

                    {/* Main image container with 3D effect */}
                    <motion.div 
                      className="relative w-56 h-56 rounded-full overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
                        boxShadow: `
                          0 20px 60px -12px rgba(0, 0, 0, 0.4),
                          0 35px 100px -20px rgba(59, 130, 246, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.2),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                        `,
                        border: '3px solid',
                        borderImageSource: 'linear-gradient(145deg, rgba(255,255,255,0.3), rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6))',
                        borderImageSlice: 1,
                      }}
                      whileHover={{
                        boxShadow: `
                          0 30px 80px -12px rgba(0, 0, 0, 0.5),
                          0 45px 120px -20px rgba(59, 130, 246, 0.4),
                          0 0 0 1px rgba(255, 255, 255, 0.1),
                          inset 0 1px 0 rgba(255, 255, 255, 0.3),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                        `
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.img 
                        src="/Developer.png" 
                        alt="عمر الهادي" 
                        className="w-full h-full object-cover"
                        whileHover={{ 
                          scale: 1.15,
                          filter: "brightness(1.1) contrast(1.1) saturate(1.2)"
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                      
                      {/* Dynamic overlay effects */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.4 }}
                      />
                      
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
                        }}
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    
                    {/* Advanced floating particles */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: `linear-gradient(45deg, 
                            ${i % 3 === 0 ? '#3B82F6' : i % 3 === 1 ? '#8B5CF6' : '#EC4899'}, 
                            ${i % 3 === 0 ? '#1D4ED8' : i % 3 === 1 ? '#7C3AED' : '#DB2777'})`,
                          top: `${Math.sin(i * 30 * Math.PI / 180) * 120 + 120}px`,
                          left: `${Math.cos(i * 30 * Math.PI / 180) * 120 + 120}px`,
                          filter: 'blur(0.5px)',
                        }}
                        animate={{
                          y: [0, -20, 0],
                          x: [0, Math.cos(i * 30 * Math.PI / 180) * 10, 0],
                          scale: [0.5, 1.2, 0.5],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 3 + (i * 0.2),
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                    
                    {/* Status indicator */}
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white/20 shadow-lg"
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(34, 197, 94, 0.7)',
                          '0 0 0 10px rgba(34, 197, 94, 0)',
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="w-full h-full bg-green-500 rounded-full"></div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Enhanced Social Links */}
                  <motion.div 
                    className="flex gap-6 mt-8 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    <motion.a
                      href="mailto:omar-elhadi@live.com"
                      className="group relative p-4 rounded-2xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      whileHover={{ 
                        scale: 1.15, 
                        y: -8,
                        rotateX: 10,
                        rotateY: 10,
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {/* Background gradient animation */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(45deg, #EF4444, #F97316)',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Icon */}
                      <motion.div
                        className="relative z-10"
                        whileHover={{ rotate: 15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Mail className="w-6 h-6 text-white group-hover:text-white transition-colors duration-300" />
                      </motion.div>
                      
                      {/* Tooltip */}
                      <motion.div
                        className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
                        initial={{ y: 10 }}
                        whileHover={{ y: 0 }}
                      >
                        Send Email
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                      </motion.div>
                      
                      {/* Ripple effect */}
                      <motion.div
                        className="absolute inset-0 opacity-0"
                        whileTap={{
                          opacity: [0, 0.3, 0],
                          scale: [0.8, 1.2],
                        }}
                        transition={{ duration: 0.6 }}
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
                        }}
                      />
                    </motion.a>

                    <motion.a
                      href="https://www.linkedin.com/in/omar-elhadi/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-4 rounded-2xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      whileHover={{ 
                        scale: 1.15, 
                        y: -8,
                        rotateX: 10,
                        rotateY: -10,
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {/* Background gradient animation */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(45deg, #0077B5, #00A0DC)',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Icon */}
                      <motion.div
                        className="relative z-10"
                        whileHover={{ rotate: -15 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Linkedin className="w-6 h-6 text-white group-hover:text-white transition-colors duration-300" />
                      </motion.div>
                      
                      {/* Tooltip */}
                      <motion.div
                        className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
                        initial={{ y: 10 }}
                        whileHover={{ y: 0 }}
                      >
                        LinkedIn Profile
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                      </motion.div>
                      
                      {/* Ripple effect */}
                      <motion.div
                        className="absolute inset-0 opacity-0"
                        whileTap={{
                          opacity: [0, 0.3, 0],
                          scale: [0.8, 1.2],
                        }}
                        transition={{ duration: 0.6 }}
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
                        }}
                      />
                    </motion.a>
                  </motion.div>
                </div>

                {/* Text Section - Right */}
                <div className="space-y-8 lg:col-span-2 relative">
                  {/* Enhanced header section */}
                  <motion.div 
                    className="text-right relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    {/* Decorative element behind name */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-2xl blur-xl transform -rotate-1"></div>
                    
                    <div className="relative">
                      <h3 className="text-4xl font-bold text-white mb-3">
                        عمر الهادي
                      </h3>
                      
                      <motion.div
                        className="flex items-center justify-start gap-3 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <span className="text-secondary-300 text-xl font-medium tracking-wide">
                          مطور البوابة وصانع المحتوى
                        </span>
                        <div className="w-12 h-px bg-gradient-to-l from-secondary-300 to-transparent"></div>
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Enhanced content with better typography */}
                  <motion.div 
                    className="text-white/90 leading-relaxed text-lg space-y-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    <div className="space-y-5">
                      {[
                        "خبير متخصص في نظم المعلومات الجغرافية معتمد من ESRI كـ ArcGIS Desktop Associate، وحاصل على درجتي البكالوريوس والماجستير في هندسة الجيوماتكس.",
                        "اكتسب خبرة واسعة كمدرب نظم معلومات جغرافية، ومطور، وقائد فريق في كل من السودان وسلطنة عمان والمملكة العربية السعودية.",
                        "لديه مستوى عالٍ من الكفاءة في مجموعة ArcGIS (Desktop، Pro، Enterprise، Online)، مع القدرة على تطوير العديد من الحلول الجغرافية الذكية عبر مشاريع متنوعة.",
                        "تبرز خبرته بتأثير تعليمي كبير، حيث قام بتدريب مئات المتخصصين في نظم المعلومات الجغرافية شخصيًا، وآلاف آخرين عبر المنصات الإلكترونية."
                      ].map((text, index) => (
                        <motion.div 
                          key={index}
                          className="group flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + (index * 0.2), duration: 0.5 }}
                          whileHover={{ x: 10, scale: 1.02 }}
                        >
                          {/* Enhanced bullet point */}
                          <motion.div
                            className="relative mt-2 flex-shrink-0"
                            whileHover={{ rotate: 180, scale: 1.2 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-secondary-400 to-primary-400 relative">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary-400 to-primary-400 animate-ping opacity-20"></div>
                            </div>
                          </motion.div>
                          
                          {/* Text with enhanced styling */}
                          <p className="group-hover:text-white transition-colors duration-300 relative">
                            {text}
                            {/* Underline effect on hover */}
                            <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-primary-400 to-secondary-400 group-hover:w-full transition-all duration-500"></span>
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Achievement badges */}
                    <motion.div 
                      className="flex flex-wrap gap-3 mt-8 justify-center lg:justify-end"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8, duration: 0.6 }}
                    >
                      {[
                        { label: "ESRI Certified", color: "from-blue-500 to-blue-600" },
                        { label: "GIS Expert", color: "from-green-500 to-green-600" },
                        { label: "Team Leader", color: "from-purple-500 to-purple-600" },
                        { label: "Trainer", color: "from-orange-500 to-orange-600" }
                      ].map((badge, index) => (
                        <motion.div
                          key={index}
                          className={`px-4 py-2 bg-gradient-to-r ${badge.color} text-white text-sm font-medium rounded-full shadow-lg`}
                          whileHover={{ 
                            scale: 1.1, 
                            y: -2,
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                          }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 2 + (index * 0.1), 
                            duration: 0.4,
                            type: "spring",
                            stiffness: 300
                          }}
                        >
                          {badge.label}
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </FloatingCard>
          </MotionCard>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <MotionCard>
            <FloatingCard className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                ابدأ رحلتك التعليمية اليوم
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                انضم إلى آلاف المتعلمين واكتشف عالم نظم المعلومات الجغرافية معنا
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.a
                  href="/courses"
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  تصفح الدورات
                </motion.a>
                <motion.a
                  href="/articles"
                  className="bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  اقرأ المقالات
                </motion.a>
              </div>
            </FloatingCard>
          </MotionCard>
        </div>
      </section>

      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full opacity-20 blur-xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 left-20 w-16 h-16 bg-gradient-to-r from-secondary-400 to-secondary-500 rounded-full opacity-25 blur-lg"
          animate={{
            y: [0, 40, 0],
            x: [0, -15, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}