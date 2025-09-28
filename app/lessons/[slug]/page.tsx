'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { remark } from 'remark';
import html from 'remark-html';
import Footer from '@/app/components/Footer';
import LessonContent from '@/app/components/LessonContent';

interface Video {
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
  videoUrl?: string;
  duration?: string;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    caption?: string;
  }>;
}

export default function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');
  const [processedContent, setProcessedContent] = useState<string>('');

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    }

    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    async function fetchVideo() {
      try {
        const response = await fetch(`/api/lessons/${slug}`);
        if (!response.ok) {
          throw new Error('Video not found');
        }
        const data = await response.json();
        setVideo(data);

        // Process content - if it's already HTML, use as is, otherwise convert from Markdown
        const contentToProcess = data.content;
        if (contentToProcess && !contentToProcess.includes('<')) {
          // It's Markdown, convert to HTML
          const processedResult = await remark().use(html).process(contentToProcess);
          setProcessedContent(processedResult.toString());
        } else {
          // It's already HTML
          setProcessedContent(contentToProcess || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
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

  if (error || !video) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">الدرس غير موجود</h1>
          <Link href="/lessons" className="text-primary-500 hover:text-secondary-500">
            العودة إلى الدروس
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
            href="/lessons"
            className="inline-flex items-center gap-2 text- hover:text-secondary-400 transition-colors"
            style={{ color: 'var(--background)' }}
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى الدروس
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Lesson Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ color: 'var(--background)' }}>
            {video.title}
          </h1>
          {video.excerpt && (
            <p className="text-xl text-gray-600 mb-4">{video.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {video.category && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {video.category}
              </span>
            )}
            {video.publishedAt && (
              <span>
                {new Date(video.publishedAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
            <span>{video.viewCount} مشاهدة</span>
          </div>
        </header>

        {/* Lesson Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          style={{
            direction: 'rtl',
            textAlign: 'right'
          }}
        >
          <LessonContent content={processedContent} />
        </div>
      </article>

      <Footer theme="light" />

      <style jsx global>{`
        .lesson-content .prose-content h1,
        .lesson-content .prose-content h2 {
          color: #1a1f1a;
          font-size: 2rem;
          font-weight: bold;
          margin: 2rem 0 1rem 0;
        }

        .lesson-content .prose-content h3 {
          color: #1a1f1a;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 1rem 0;
        }

        .lesson-content .prose-content h4,
        .lesson-content .prose-content h5,
        .lesson-content .prose-content h6 {
          color: #1a1f1a;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }

        .lesson-content .prose-content p {
          color: #2d3748;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .lesson-content .prose-content ul,
        .lesson-content .prose-content ol {
          color: #2d3748;
          padding-right: 2rem;
          margin-bottom: 1.5rem;
        }

        .lesson-content .prose-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
          color: #2d3748;
        }

        .lesson-content .prose-content strong {
          color: #293f28;
          font-weight: 600;
        }

        .lesson-content .prose-content img {
          border-radius: 1rem;
          margin: 2rem auto;
          max-width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .lesson-content .prose-content blockquote {
          border-right: 4px solid #293F28;
          padding: 1.5rem 1.5rem 1.5rem 2rem;
          margin: 2rem 0;
          background: #1A1F1A;
          border-radius: 0.5rem;
          font-style: italic;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .lesson-content .prose-content blockquote p {
          color: #F5F7F5 !important;
          margin-bottom: 1rem;
        }

        .lesson-content .prose-content blockquote::before {
          content: '"';
          position: absolute;
          top: -10px;
          right: 10px;
          font-size: 3rem;
          color: #ADD900;
          font-family: serif;
          line-height: 1;
        }

        .lesson-content .prose-content a {
          color: #ADD900;
          text-decoration: underline;
        }

        .lesson-content .prose-content a:hover {
          color: #95c100;
        }

        /* YouTube player container styling */
        .youtube-player {
          margin: 2rem 0;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}