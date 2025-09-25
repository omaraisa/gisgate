'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ContentLayout from '../../components/ContentLayout';
import MetaInfo from '../../components/MetaInfo';
import VideoPlayer from '../../components/VideoPlayer';

interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  category?: string;
  tags?: string;
  publishedAt?: string;
  viewCount: number;
}

export default function TutorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
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

    async function fetchTutorial() {
      try {
        const response = await fetch(`/api/tutorials/${slug}`);
        if (!response.ok) {
          throw new Error('Tutorial not found');
        }
        const data = await response.json();
        setTutorial(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    }

    fetchTutorial();
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

  if (error || !tutorial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-4">الدرس غير موجود</h1>
          <Link href="/" className="text-secondary-400 hover:text-secondary-300">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const tags = tutorial.tags ? JSON.parse(tutorial.tags) : [];

  return (
    <ContentLayout>
      <MetaInfo
        title={tutorial.title}
        category={tutorial.category}
        publishedAt={tutorial.publishedAt}
        viewCount={tutorial.viewCount}
        tags={tags}
      />

      <div className="mb-12">
        <VideoPlayer url={tutorial.videoUrl} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="prose prose-lg prose-invert max-w-none"
        style={{
          direction: 'rtl',
          textAlign: 'right',
        }}
      >
        <p className="text-foreground-muted leading-relaxed">{tutorial.description}</p>
      </motion.div>
    </ContentLayout>
  );
}