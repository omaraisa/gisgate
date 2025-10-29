'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface PostCardProps {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt?: Date | null;
  featuredImage?: string | null;
  authorName?: string | null;
  category?: string | null;
  type?: 'article' | 'video' | 'course';
}

export default function PostCard({
  title,
  excerpt,
  slug,
  publishedAt,
  featuredImage,
  authorName,
  category,
  type = 'article'
}: PostCardProps) {
  const link = type === 'video' ? `/lessons/${slug}` : type === 'course' ? `/courses/${slug}` : `/articles/${slug}`;

  return (
    <motion.div
      whileHover={{ 
        y: -10, 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl h-full cursor-pointer shadow-xl hover:shadow-2xl hover:bg-white/10 transition-all duration-300 overflow-hidden"
    >
      <Link href={link}>
        {/* Featured Image */}
        {featuredImage && (
          <div className="relative h-48 overflow-hidden rounded-t-2xl">
            <motion.img 
              src={featuredImage} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {category && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold rounded-full">
                  {category}
                </span>
              </div>
            )}
            {type === 'video' && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                  🎥 فيديو
                </span>
              </div>
            )}
            {type === 'course' && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                  🎓 دورة
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-secondary-300 transition-colors">
            {title}
          </h3>
          
          {excerpt && (
            <p className="text-white/90 text-sm leading-relaxed mb-4">
              {excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-white/60">
            {publishedAt && (
              <span>
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
            {authorName && (
              <span className="text-white/70">
                {authorName}
              </span>
            )}
          </div>
          
          <motion.div
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            className="h-1 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full mt-4"
          />
        </div>
      </Link>
    </motion.div>
  );
}
