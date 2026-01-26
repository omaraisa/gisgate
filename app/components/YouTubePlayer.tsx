'use client';

import YouTube, { YouTubeProps } from 'react-youtube';
import { useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  opts?: YouTubeProps['opts'];
  onReady?: YouTubeProps['onReady'];
  onError?: YouTubeProps['onError'];
  onPlay?: YouTubeProps['onPlay'];
  onPause?: YouTubeProps['onPause'];
  onEnd?: YouTubeProps['onEnd'];
  onStateChange?: YouTubeProps['onStateChange'];
}

export default function YouTubePlayer({
  videoId,
  title = 'YouTube Video',
  className = '',
  opts,
  onReady,
  onError,
  onPlay,
  onPause,
  onEnd,
  onStateChange,
}: YouTubePlayerProps) {
  const [hasError, setHasError] = useState(false);

  // Default options for responsive video player
  const defaultOpts: YouTubeProps['opts'] = {
    height: '390',
    width: '640',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      fs: 1,
      cc_load_policy: 0,
      controls: 1,
    },
  };

  const finalOpts = { ...defaultOpts, ...opts };

  const handleError: YouTubeProps['onError'] = (event) => {
    console.error('YouTube player error:', event.data);
    setHasError(true);
    if (onError) {
      onError(event);
    }
  };

  if (hasError) {
    return (
      <div className={`youtube-player-error ${className} bg-gray-900 border border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center text-white`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">فيديو غير متاح</h3>
          <p className="text-gray-400 mb-4">
            هذا الفيديو غير متاح للتضمين أو تم تعطيله من قبل صاحبه.
          </p>
          <p className="text-sm text-gray-500">
            يمكنك مشاهدة الفيديو مباشرة على يوتيوب:
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            شاهد على يوتيوب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`youtube-player ${className}`}>
      <YouTube
        videoId={videoId}
        opts={finalOpts}
        onReady={onReady}
        onError={handleError}
        onPlay={onPlay}
        onPause={onPause}
        onEnd={onEnd}
        onStateChange={onStateChange}
        className="w-full aspect-video"
        iframeClassName="w-full h-full rounded-lg"
        title={title}
      />
    </div>
  );
}

// Utility function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Regular expressions for different YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Utility function to check if a URL is a YouTube URL
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}