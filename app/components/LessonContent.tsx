'use client';

import { useMemo } from 'react';
import YouTubePlayer, { extractYouTubeVideoId } from './YouTubePlayer';

interface LessonContentProps {
  content: string;
  className?: string;
}

export default function LessonContent({ content, className = '' }: LessonContentProps) {
  // Process content to extract and replace YouTube embeds
  const processedContent = useMemo(() => {
    if (!content) return [];

    const parts: Array<{ type: 'text' | 'youtube'; content: string; videoId?: string }> = [];

    // Split content by YouTube iframe tags
    const iframeRegex = /<iframe[^>]*src="[^"]*youtube\.com[^"]*"[^>]*><\/iframe>/gi;
    const textParts = content.split(iframeRegex);

    // Find all YouTube iframes
    const iframeMatches = content.match(iframeRegex) || [];

    let textIndex = 0;
    let iframeIndex = 0;

    // Process text parts and iframe parts alternately
    while (textIndex < textParts.length || iframeIndex < iframeMatches.length) {
      // Add text part if it exists and is not empty
      if (textIndex < textParts.length && textParts[textIndex].trim()) {
        parts.push({
          type: 'text',
          content: textParts[textIndex]
        });
      }
      textIndex++;

      // Add YouTube video if iframe exists
      if (iframeIndex < iframeMatches.length) {
        const iframeHtml = iframeMatches[iframeIndex];
        const srcMatch = iframeHtml.match(/src="([^"]*)"/);
        if (srcMatch) {
          const videoId = extractYouTubeVideoId(srcMatch[1]);
          if (videoId) {
            parts.push({
              type: 'youtube',
              content: iframeHtml,
              videoId
            });
          } else {
            // If we can't extract video ID, keep as text
            parts.push({
              type: 'text',
              content: iframeHtml
            });
          }
        }
        iframeIndex++;
      }
    }

    return parts;
  }, [content]);

  return (
    <div className={`lesson-content ${className}`}>
      {processedContent.map((part, index) => {
        if (part.type === 'youtube' && part.videoId) {
          return (
            <div key={index} className="my-8 flex justify-center">
              <div className="w-full max-w-4xl">
                <YouTubePlayer
                  videoId={part.videoId}
                  title={`درس - ${part.videoId}`}
                  className="w-full"
                  opts={{
                    width: '100%',
                    height: '480',
                    playerVars: {
                      autoplay: 0,
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                      iv_load_policy: 3,
                      fs: 1,
                      cc_load_policy: 0,
                      controls: 1,
                    },
                  }}
                />
              </div>
            </div>
          );
        }

        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: part.content }}
            className="prose-content"
          />
        );
      })}
    </div>
  );
}