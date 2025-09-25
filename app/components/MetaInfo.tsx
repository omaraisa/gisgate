import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Eye, Tag, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MetaInfoProps {
  title: string;
  category?: string;
  excerpt?: string;
  publishedAt?: string;
  viewCount: number;
  tags?: string[];
}

export default function MetaInfo({
  title,
  category,
  excerpt,
  publishedAt,
  viewCount,
  tags = [],
}: MetaInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-12 border-b border-border pb-8"
    >
      {/* Category */}
      {category && (
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="inline-block px-4 py-2 bg-gradient-to-r from-secondary-600 to-secondary-500 text-primary-700 text-sm font-bold rounded-full mb-6"
        >
          {category}
        </motion.span>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-secondary-500 mb-6 leading-tight"
        style={{ textShadow: '0 0 20px rgba(173, 217, 0, 0.3)' }}
      >
        {title}
      </motion.h1>

      {/* Excerpt */}
      {excerpt && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xl text-foreground-secondary mb-8 leading-relaxed"
        >
          {excerpt}
        </motion.p>
      )}

      {/* Meta Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-wrap items-center gap-x-6 gap-y-4 text-foreground-muted"
      >
        {publishedAt && (
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary-500" />
            <span>
              {format(new Date(publishedAt), 'dd MMMM yyyy', { locale: ar })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-secondary-500" />
          <span>{viewCount} مشاهدة</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-surface-hover rounded-full transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>مشاركة</span>
        </motion.button>
      </motion.div>

      {/* Tags */}
      {tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8"
        >
          <div className="flex flex-wrap gap-3">
            {tags.map((tag: string, index: number) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(173, 217, 0, 0.2)' }}
                className="px-3 py-1 bg-secondary-600/10 border border-secondary-500/30 text-secondary-400 rounded-full text-sm font-semibold cursor-pointer transition-colors"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}