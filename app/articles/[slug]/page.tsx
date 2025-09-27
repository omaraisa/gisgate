'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">المقال غير موجود</h1>
          <Link href="/" className="text-primary-500 hover:text-secondary-500">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-background/90 backdrop-blur-md border-b border-background/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text- hover:text-secondary-400 transition-colors"
            style={{ color: 'var(--background)' }}
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى الرئيسية
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          style={{
            direction: 'rtl',
            textAlign: 'right'
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }}
            className="article-content"
          />
        </div>




      </article>

      <style jsx global>{`
        .article-content h1,
        .article-content h2 {
          color: var(--background);
          font-size: 2rem;
          font-weight: bold;
          margin: 2rem 0 1rem 0;
        }
        
        .article-content h3 {
          color: var(--background);
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 1rem 0;
        }
        
        .article-content h4,
        .article-content h5,
        .article-content h6 {
          color: var(--background);
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        
        .article-content p {
          color: var(--background);
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }
        
        .article-content ul, .article-content ol {
          color: var(--background);
          padding-right: 2rem;
          margin-bottom: 1.5rem;
        }
        
        .article-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
          color: var(--background);
        }
        
        .article-content strong {
          color: var(--primary-700);
          font-weight: 600;
        }
        
        .article-content img {
          border-radius: 1rem;
          margin: 2rem auto;
          max-width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .article-content blockquote {
          border-right: 4px solid var(--primary-500);
          padding-right: 1.5rem;
          margin: 2rem 0;
          background: var(--background-secondary);
          padding: 1.5rem;
          border-radius: 0.5rem;
          color: var(--foreground);
        }

        .article-content a {
          color: var(--primary-600);
          text-decoration: underline;
        }

        .article-content a:hover {
          color: var(--primary-500);
        }
      `}</style>
    </div>
  );
}
