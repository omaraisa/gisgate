'use client';

import YouTube, { YouTubeProps } from 'react-youtube';

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

  return (
    <div className={`youtube-player ${className}`}>
      <YouTube
        videoId={videoId}
        opts={finalOpts}
        onReady={onReady}
        onError={onError}
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