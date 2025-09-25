'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ContentLayout from '../../components/ContentLayout';
import MetaInfo from '../../components/MetaInfo';

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

export default function ArticlePage({ params }: { params: Promise<{ slug:string }> }) {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-secondary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-4">المقال غير موجود</h1>
          <Link href="/" className="text-secondary-400 hover:text-secondary-300">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const tags = article.tags ? JSON.parse(article.tags) : [];

  return (
    <ContentLayout>
      <MetaInfo
        title={article.title}
        category={article.category}
        excerpt={article.excerpt}
        publishedAt={article.publishedAt}
        viewCount={article.viewCount}
        tags={tags}
      />

      {article.featuredImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-12 rounded-2xl overflow-hidden shadow-2xl"
        >
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="prose prose-lg prose-invert max-w-none mb-12"
        style={{
          direction: 'rtl',
          textAlign: 'right',
        }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
          className="article-content"
        />
      </motion.div>

      {article.images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16"
        >
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-secondary-500 mb-8">
            الصور المرفقة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {article.images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-surface-elevated backdrop-blur-md rounded-2xl overflow-hidden border border-border"
              >
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className="w-full h-56 object-cover"
                />
                {image.caption && (
                  <div className="p-4">
                    <p className="text-foreground-muted">{image.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        .article-content h2 {
          font-size: 2rem;
          font-weight: bold;
          margin: 2.5rem 0 1.5rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--border);
          color: var(--foreground);
        }
        
        .article-content h3 {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 2rem 0 1rem 0;
          color: var(--foreground-secondary);
        }
        
        .article-content p {
          color: var(--foreground-muted);
          line-height: 1.9;
          margin-bottom: 1.5rem;
        }
        
        .article-content a {
          color: var(--secondary-400);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .article-content a:hover {
          color: var(--secondary-500);
          text-decoration: underline;
        }

        .article-content ul, .article-content ol {
          color: var(--foreground-muted);
          padding-right: 2rem;
          margin-bottom: 1.5rem;
        }
        
        .article-content li {
          margin-bottom: 0.75rem;
          line-height: 1.8;
        }
        
        .article-content strong {
          color: var(--foreground);
          font-weight: 600;
        }
        
        .article-content img {
          border-radius: 1rem;
          margin: 2.5rem auto;
          max-width: 100%;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
        }
        
        .article-content blockquote {
          border-right: 4px solid var(--secondary-500);
          padding: 1.5rem;
          margin: 2.5rem 0;
          background: var(--surface);
          border-radius: 0.5rem;
          color: var(--foreground);
        }
      `}</style>
    </ContentLayout>
  );
}