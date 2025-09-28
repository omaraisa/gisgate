// Example usage of YouTubePlayer component

import YouTubePlayer, { extractYouTubeVideoId, isYouTubeUrl } from '@/app/components/YouTubePlayer';

// Basic usage
function BasicExample() {
  return (
    <YouTubePlayer
      videoId="dQw4w9WgXcQ"
      title="Sample YouTube Video"
    />
  );
}

// From a YouTube URL
function FromUrlExample() {
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const videoId = extractYouTubeVideoId(youtubeUrl);

  return (
    <>
      {isYouTubeUrl(youtubeUrl) && videoId && (
        <YouTubePlayer
          videoId={videoId}
          title="Video from URL"
          opts={{
            width: '100%',
            height: '360',
            playerVars: {
              autoplay: 1, // Auto-play
              controls: 1,
            },
          }}
        />
      )}
    </>
  );
}

// Advanced usage with event handlers
function AdvancedExample() {
  return (
    <YouTubePlayer
      videoId="dQw4w9WgXcQ"
      title="Advanced YouTube Player"
      onReady={(event) => {
        console.log('Player ready:', event.target);
      }}
      onPlay={() => {
        console.log('Video started playing');
      }}
      onPause={() => {
        console.log('Video paused');
      }}
      onEnd={() => {
        console.log('Video ended');
      }}
      onError={(event) => {
        console.error('YouTube player error:', event.data);
      }}
      opts={{
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
      }}
    />
  );
}

export { BasicExample, FromUrlExample, AdvancedExample };