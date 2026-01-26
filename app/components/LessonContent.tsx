'use client';

import { useMemo } from 'react';
import YouTubePlayer, { extractYouTubeVideoId } from './YouTubePlayer';
import { sanitizeHTML } from '@/lib/sanitize-html';

interface LessonContentProps {
  content: string;
  className?: string;
}

export default function LessonContent({ content, className = '' }: LessonContentProps) {
  // Process content to extract and replace YouTube embeds
  const processedContent = useMemo(() => {
    if (!content) return [];

    const parts: Array<{ type: 'text' | 'youtube'; content: string; videoId?: string }> = [];

    // Split content by YouTube markers, iframe tags and Elementor video widgets
    const youtubeMarkerRegex = /\[YOUTUBE:([^\]]+)\]/g;
    const iframeRegex = /<iframe[^>]*src="[^"]*youtube\.com[^"]*"[^>]*><\/iframe>/gi;
    const elementorVideoRegex = /<div[^>]*class="[^"]*elementor-widget-video[^"]*"[^>]*data-settings="[^"]*youtube_url[^"]*"[^>]*><\/div>/gi;

    // Combine all matches
    const youtubeMarkers = content.match(youtubeMarkerRegex) || [];
    const iframeMatches = content.match(iframeRegex) || [];
    const elementorMatches = content.match(elementorVideoRegex) || [];

    // Create a combined regex for splitting
    const combinedRegex = new RegExp(`(${youtubeMarkerRegex.source}|${iframeRegex.source}|${elementorVideoRegex.source})`, 'gi');
    const textParts = content.split(combinedRegex);

    let textIndex = 0;
    let youtubeIndex = 0;
    let iframeIndex = 0;
    let elementorIndex = 0;

    // Process text parts and embed parts alternately
    while (textIndex < textParts.length) {
      // Add text part if it exists and is not empty
      if (textParts[textIndex] && textParts[textIndex].trim()) {
        // Check if this text part is actually an embed (due to regex matching)
        const isYouTubeMarker = youtubeMarkerRegex.test(textParts[textIndex]);
        const isIframe = iframeRegex.test(textParts[textIndex]);
        const isElementor = elementorVideoRegex.test(textParts[textIndex]);

        if (isYouTubeMarker && youtubeIndex < youtubeMarkers.length) {
          const marker = youtubeMarkers[youtubeIndex];
          const videoIdMatch = marker.match(/\[YOUTUBE:([^\]]+)\]/);
          if (videoIdMatch) {
            parts.push({
              type: 'youtube',
              content: marker,
              videoId: videoIdMatch[1]
            });
          }
          youtubeIndex++;
        } else if (isIframe && iframeIndex < iframeMatches.length) {
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
        } else if (isElementor && elementorIndex < elementorMatches.length) {
          const elementorHtml = elementorMatches[elementorIndex];
          const settingsMatch = elementorHtml.match(/data-settings="([^"]*)"/);
          if (settingsMatch) {
            try {
              const settings = JSON.parse(settingsMatch[1].replace(/&quot;/g, '"'));
              if (settings.youtube_url) {
                const videoId = extractYouTubeVideoId(settings.youtube_url);
                if (videoId) {
                  parts.push({
                    type: 'youtube',
                    content: elementorHtml,
                    videoId
                  });
                } else {
                  // If we can't extract video ID, keep as text
                  parts.push({
                    type: 'text',
                    content: elementorHtml
                  });
                }
              }
            } catch (e) {
              // If JSON parsing fails, keep as text
              console.warn('Failed to parse Elementor video settings:', e)
              parts.push({
                type: 'text',
                content: elementorHtml
              });
            }
          }
          elementorIndex++;
        } else {
          parts.push({
            type: 'text',
            content: textParts[textIndex]
          });
        }
      }
      textIndex++;
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
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(part.content) }}
            className="prose-content"
          />
        );
      })}
    </div>
  );
}