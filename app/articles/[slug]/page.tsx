'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Calendar, Eye, Tag, Share2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
  tags?: string;
  publishedAt?: string;
  viewCount: number;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    caption?: string;
  }>;
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    
    async function fetchArticle() {
      try {
        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          throw new Error('Article not found');
        }
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">المقال غير موجود</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const tags = article.tags ? JSON.parse(article.tags) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى الرئيسية
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Featured Image */}
          {article.featuredImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
            >
              <img 
                src={article.featuredImage} 
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </motion.div>
          )}

          {/* Category */}
          {article.category && (
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full mb-6"
            >
              {article.category}
            </motion.span>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          >
            {article.title}
          </motion.h1>

          {/* Excerpt */}
          {article.excerpt && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-300 mb-8 leading-relaxed"
            >
              {article.excerpt}
            </motion.p>
          )}

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-6 text-gray-300"
          >
            {article.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {format(new Date(article.publishedAt), 'dd MMMM yyyy', { locale: ar })}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>{article.viewCount} مشاهدة</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="prose prose-lg prose-invert max-w-none mb-12"
          style={{
            direction: 'rtl',
            textAlign: 'right'
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }}
            className="article-content"
          />
        </motion.div>

        {/* Tags */}
        {tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <Tag className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">الكلمات المفتاحية</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag: string, index: number) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 rounded-full text-sm hover:bg-blue-600/30 transition-colors cursor-pointer"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Article Images Gallery */}
        {article.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold text-white mb-6">الصور المرفقة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {article.images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20"
                >
                  <img 
                    src={image.url} 
                    alt={image.alt || ''} 
                    className="w-full h-48 object-cover"
                  />
                  {image.caption && (
                    <div className="p-4">
                      <p className="text-gray-300">{image.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </article>

      <style jsx global>{`
        .article-content h2 {
          color: #ffffff;
          font-size: 2rem;
          font-weight: bold;
          margin: 2rem 0 1rem 0;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .article-content h3 {
          color: #e5e7eb;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 1rem 0;
        }
        
        .article-content p {
          color: #d1d5db;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }
        
        .article-content ul, .article-content ol {
          color: #d1d5db;
          padding-right: 2rem;
          margin-bottom: 1.5rem;
        }
        
        .article-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        
        .article-content strong {
          color: #ffffff;
          font-weight: 600;
        }
        
        .article-content img {
          border-radius: 1rem;
          margin: 2rem auto;
          max-width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .article-content blockquote {
          border-right: 4px solid #3b82f6;
          padding-right: 1.5rem;
          margin: 2rem 0;
          background: rgba(59, 130, 246, 0.1);
          padding: 1.5rem;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
