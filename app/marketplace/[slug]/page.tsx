'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, Package, Star, DollarSign, Code, FileText, Globe, Calendar, Eye, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import AnimatedBackground from '@/app/components/AnimatedBackground';

interface Solution {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt?: string;
  featuredImage?: string;
  images?: string;
  solutionType: string;
  category?: string;
  tags?: string;
  price?: number;
  currency?: string;
  isFree: boolean;
  fileUrl?: string;
  fileSize?: string;
  fileType?: string;
  demoUrl?: string;
  documentationUrl?: string;
  sourceCodeUrl?: string;
  version?: string;
  compatibility?: string;
  requirements?: string;
  publishedAt?: string;
  downloadCount: number;
  viewCount: number;
  rating?: number;
  reviewCount: number;
  author?: {
    id: string;
    fullName?: string;
    email: string;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: {
      fullName?: string;
      email: string;
    };
  }>;
}

const SOLUTION_TYPE_LABELS: Record<string, string> = {
  TOOL: 'أداة',
  ADDIN: 'إضافة',
  PLUGIN: 'مكون إضافي',
  SCRIPT: 'سكريبت',
  DATASET: 'مجموعة بيانات',
  TEMPLATE: 'قالب',
  TOOLBOX: 'صندوق أدوات',
  MODEL: 'نموذج',
  STYLE: 'ستايل',
  WIDGET: 'ويدجت',
  APPLICATION: 'تطبيق',
  SERVICE: 'خدمة',
  EXTENSION: 'امتداد',
  LIBRARY: 'مكتبة',
  CONFIGURATION: 'ملف إعدادات',
  OTHER: 'أخرى'
};

export default function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }

    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function fetchSolution() {
      try {
        const response = await fetch(`/api/marketplace/${slug}`);
        if (!response.ok) {
          throw new Error('Solution not found');
        }
        const data = await response.json();
        setSolution(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load solution');
      } finally {
        setLoading(false);
      }
    }

    fetchSolution();
  }, [slug]);

  const handleDownload = async () => {
    if (!solution?.fileUrl) return;

    setDownloading(true);
    try {
      // Track download
      await fetch('/api/marketplace/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solutionId: solution.id })
      });

      // Open download link
      window.open(solution.fileUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const parseCompatibility = (compatibility?: string) => {
    if (!compatibility) return [];
    try {
      return JSON.parse(compatibility);
    } catch {
      return [compatibility];
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

  if (error || !solution) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">الحل غير موجود</h1>
          <Link href="/marketplace" className="text-secondary-400 hover:text-secondary-300 transition-colors duration-200">
            العودة إلى المتجر
          </Link>
        </div>
      </div>
    );
  }

  const compatibilityList = parseCompatibility(solution.compatibility);
  const tags = solution.tags ? solution.tags.split(',').map(t => t.trim()) : [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى المتجر
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl mb-8"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Image and Quick Actions */}
            <div>
              {solution.featuredImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  src={solution.featuredImage}
                  alt={solution.title}
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl mb-6"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="w-32 h-32 text-white/40" />
                </div>
              )}

              {/* Download/Purchase Button */}
              {solution.fileUrl && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-gradient-to-r from-orange-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Download className="w-6 h-6" />
                  {downloading ? 'جاري التحميل...' : solution.isFree ? 'تحميل مجاني' : `شراء مقابل ${solution.price} ${solution.currency}`}
                </motion.button>
              )}

              {/* External Links */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {solution.demoUrl && (
                  <a
                    href={solution.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg text-center text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    تجربة
                  </a>
                )}
                {solution.documentationUrl && (
                  <a
                    href={solution.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg text-center text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    التوثيق
                  </a>
                )}
                {solution.sourceCodeUrl && (
                  <a
                    href={solution.sourceCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg text-center text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    الكود
                  </a>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div>
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-semibold rounded-full">
                  {SOLUTION_TYPE_LABELS[solution.solutionType] || solution.solutionType}
                </span>
                {solution.isFree ? (
                  <span className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-full">
                    مجاني
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {solution.price} {solution.currency}
                  </span>
                )}
                {solution.category && (
                  <span className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-full">
                    {solution.category}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {solution.title}
              </h1>

              {solution.excerpt && (
                <p className="text-xl text-white/90 mb-6 leading-relaxed">
                  {solution.excerpt}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                  <Download className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{solution.downloadCount}</div>
                  <div className="text-xs text-white/60">تحميل</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                  <Eye className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{solution.viewCount}</div>
                  <div className="text-xs text-white/60">مشاهدة</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2 fill-yellow-400" />
                  <div className="text-2xl font-bold text-white">{solution.rating ? solution.rating.toFixed(1) : '0.0'}</div>
                  <div className="text-xs text-white/60">{solution.reviewCount || 0} تقييم</div>
                </div>

                {solution.version && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                    <Package className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-lg font-bold text-white">{solution.version}</div>
                    <div className="text-xs text-white/60">الإصدار</div>
                  </div>
                )}
              </div>

              {/* File Info */}
              {solution.fileUrl && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    معلومات الملف
                  </h3>
                  <div className="space-y-2 text-sm">
                    {solution.fileType && (
                      <div className="flex justify-between">
                        <span className="text-white/60">النوع:</span>
                        <span className="text-white">{solution.fileType}</span>
                      </div>
                    )}
                    {solution.fileSize && (
                      <div className="flex justify-between">
                        <span className="text-white/60">الحجم:</span>
                        <span className="text-white">{solution.fileSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compatibility */}
              {compatibilityList.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    التوافق
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {compatibilityList.map((item: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 text-sm rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Description Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-400" />
            الوصف
          </h2>
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
              {solution.description}
            </p>
          </div>

          {/* Requirements */}
          {solution.requirements && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">المتطلبات</h3>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                {solution.requirements}
              </p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">الوسوم</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="px-4 py-2 bg-white/5 border border-white/10 text-white/80 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Reviews Section */}
        {solution.reviews && solution.reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              التقييمات ({solution.reviewCount})
            </h2>

            <div className="space-y-6">
              {solution.reviews.map((review) => (
                <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-semibold text-white">
                        {review.user.fullName || review.user.email.split('@')[0]}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-white/60">
                      {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-white/80 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Author Section */}
        {solution.author && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">المطور</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(solution.author.fullName || solution.author.email)[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white text-lg">
                  {solution.author.fullName || solution.author.email.split('@')[0]}
                </div>
                {solution.publishedAt && (
                  <div className="text-white/60 text-sm flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    نُشر في {new Date(solution.publishedAt).toLocaleDateString('ar-SA')}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
