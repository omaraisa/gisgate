'use client';

import { motion } from 'framer-motion';
import ReactPlayer from 'react-player/youtube';
import { Youtube } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  if (!url) {
    return (
      <div className="w-full aspect-video bg-surface rounded-2xl flex flex-col items-center justify-center text-center p-8 border border-border">
        <Youtube className="w-16 h-16 text-foreground-muted mb-4" />
        <h3 className="text-xl font-bold text-foreground">الفيديو غير متاح</h3>
        <p className="text-foreground-muted">
          عذراً، يبدو أن رابط الفيديو غير صحيح أو أنه حُذف.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border"
    >
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls
        config={{
          youtube: {
            playerVars: {
              showinfo: 0,
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
    </motion.div>
  );
}