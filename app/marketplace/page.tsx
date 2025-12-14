'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode, useEffect, useState, useCallback } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Package, Download, DollarSign, Search } from 'lucide-react';
import Link from 'next/link';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import { RatingDisplay } from '../components/StarRating';

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
  rating?: number;
  reviewCount: number;
  version?: string;
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

const SOLUTION_TYPES = [
  { value: '', label: 'الكل' },
  { value: 'TOOL', label: 'أداة' },
  { value: 'ADDIN', label: 'إضافة' },
  { value: 'PLUGIN', label: 'مكون إضافي' },
  { value: 'SCRIPT', label: 'سكريبت' },
  { value: 'DATASET', label: 'مجموعة بيانات' },
  { value: 'TEMPLATE', label: 'قالب' },
  { value: 'TOOLBOX', label: 'صندوق أدوات' },
  { value: 'MODEL', label: 'نموذج' },
  { value: 'STYLE', label: 'ستايل' },
  { value: 'WIDGET', label: 'ويدجت' },
  { value: 'APPLICATION', label: 'تطبيق' },
  { value: 'SERVICE', label: 'خدمة' },
  { value: 'EXTENSION', label: 'امتداد' },
  { value: 'LIBRARY', label: 'مكتبة' },
  { value: 'CONFIGURATION', label: 'ملف إعدادات' },
  { value: 'OTHER', label: 'أخرى' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'popular', label: 'الأكثر تحميلاً' },
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'title', label: 'الاسم' }
];

export default function MarketplacePage() {
  const [data, setData] = useState<SolutionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'PUBLISHED',
        limit: '20'
      });

      if (selectedType) params.append('type', selectedType);
      if (priceFilter === 'free') params.append('isFree', 'true');
      if (priceFilter === 'paid') params.append('isFree', 'false');
      if (sortBy) params.append('sortBy', sortBy);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/marketplace?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch solutions');
      }
      const solutionsData = await response.json();
      setData(solutionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load solutions');
    } finally {
      setLoading(false);
    }
  }, [selectedType, priceFilter, sortBy, searchQuery]);

  useEffect(() => {
    fetchSolutions();
  }, [selectedType, priceFilter, sortBy, searchQuery, fetchSolutions]);

  const getSolutionTypeLabel = (type: string) => {
    return SOLUTION_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading && !data) {
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

  if (error && !data) {
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
          <h1 className="text-2xl font-bold text-white mb-4">خطأ في تحميل المتجر</h1>
          <Link href="/" className="text-secondary-400 hover:text-secondary-300 transition-colors duration-200">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

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
                متجر
              </span>
              <br />
              <span 
                className="font-extrabold text-white drop-shadow-lg"
                style={{
                  color: '#FFFFFF',
                  textShadow: '0 0 20px rgba(41, 63, 40, 0.8), 0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                الحلول
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-8"
          >
            <div className="text-xl md:text-2xl text-white h-20">
              <TypeAnimation
                sequence={[
                  'اكتشف أدوات وإضافات نظم المعلومات الجغرافية',
                  2000,
                  'قوالب جاهزة ومجموعات بيانات متنوعة',
                  2000,
                  'سكريبتات ونماذج قابلة للتخصيص',
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

      {/* Filters Section */}
      <div className="relative z-10 bg-transparent">
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filters */}
            <MotionCard className="mb-12">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن الحلول..."
                        className="w-full pr-10 pl-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {SOLUTION_TYPES.map(type => (
                        <option key={type.value} value={type.value} className="bg-white text-gray-900">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Filter */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPriceFilter('all')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        priceFilter === 'all'
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setPriceFilter('free')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        priceFilter === 'free'
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      مجاني
                    </button>
                    <button
                      onClick={() => setPriceFilter('paid')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        priceFilter === 'paid'
                          ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      مدفوع
                    </button>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                  <span className="text-white/80 text-sm">الترتيب:</span>
                  <div className="flex gap-2 flex-wrap">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sortBy === option.value
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </MotionCard>

            {/* Section Title */}
            <MotionCard className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  جميع الحلول
                </span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 mx-auto rounded-full"></div>
            </MotionCard>

            {/* Solutions Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {data?.solutions.map((solution, index) => (
                    <MotionCard key={solution.id} delay={index * 0.1}>
                      <FloatingCard className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300">
                        <Link href={`/marketplace/${solution.slug}`}>
                          {/* Featured Image */}
                          {solution.featuredImage ? (
                            <div className="relative h-48 overflow-hidden rounded-t-2xl">
                              <motion.img 
                                src={solution.featuredImage} 
                                alt={solution.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              {/* Type Badge */}
                              <div className="absolute top-4 right-4">
                                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-semibold rounded-full">
                                  {getSolutionTypeLabel(solution.solutionType)}
                                </span>
                              </div>
                              {/* Price Badge */}
                              <div className="absolute top-4 left-4">
                                {solution.isFree ? (
                                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                    مجاني
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {solution.price} {solution.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="relative h-48 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 rounded-t-2xl flex items-center justify-center">
                              <Package className="w-20 h-20 text-white/40" />
                              {/* Type Badge */}
                              <div className="absolute top-4 right-4">
                                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-semibold rounded-full">
                                  {getSolutionTypeLabel(solution.solutionType)}
                                </span>
                              </div>
                              {/* Price Badge */}
                              <div className="absolute top-4 left-4">
                                {solution.isFree ? (
                                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                    مجاني
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {solution.price} {solution.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-6">
                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors line-clamp-2">
                              {solution.title}
                            </h3>
                            
                            {solution.version && (
                              <p className="text-white/60 text-xs mb-3">
                                الإصدار {solution.version}
                              </p>
                            )}

                            {solution.excerpt && (
                              <p className="text-white/80 text-sm leading-relaxed mb-4 line-clamp-3">
                                {solution.excerpt}
                              </p>
                            )}

                            {/* Meta Info */}
                            <div className="flex items-center justify-between text-sm text-white/60 pt-4 border-t border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Download className="w-4 h-4" />
                                  <span>{solution.downloadCount}</span>
                                </div>
                                
                                <RatingDisplay
                                  rating={solution.rating || 0}
                                  reviewCount={solution.reviewCount || 0}
                                  size="sm"
                                  showCount={true}
                                  className="text-white/60"
                                />
                              </div>

                              {solution.category && (
                                <span className="text-xs text-white/50">{solution.category}</span>
                              )}
                            </div>
                            
                            <motion.div
                              initial={{ width: 0 }}
                              whileHover={{ width: "100%" }}
                              className="h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-cyan-400 rounded-full mt-4"
                            />
                          </div>
                        </Link>
                      </FloatingCard>
                    </MotionCard>
                  ))}
                </div>

                {/* Empty State */}
                {data && data.solutions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-20"
                  >
                    <Package className="w-20 h-20 text-white/40 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-4">لا توجد حلول متاحة</h2>
                    <p className="text-white/70">جرب تغيير معايير البحث</p>
                  </motion.div>
                )}

                {/* Stats */}
                {data && data.solutions.length > 0 && (
                  <MotionCard className="text-center mt-12" delay={0.8}>
                    <div className="text-white/80 text-lg">
                      عرض <span className="font-bold text-orange-400">{data.solutions.length}</span> من أصل <span className="font-bold text-cyan-400">{data.pagination.total}</span> حل
                    </div>
                  </MotionCard>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
