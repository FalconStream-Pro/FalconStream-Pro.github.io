'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { getVolume, setVolume as saveVolume } from '@/lib/storage';

interface VideoPlayerProps {
  url: string;
  channelName: string;
  onStreamEnded?: () => void;
}

export default function VideoPlayer({ url, channelName, onStreamEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setError('');
    setLoading(true);
    video.volume = getVolume();

    destroyHls();

    if (url.includes('.m3u8') || url.includes('.m3u')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setLoading(false);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error. The stream may be offline or unavailable.');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError('Failed to load stream. Please try another channel.');
                destroyHls();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setLoading(false);
          video.play().catch(() => {});
        });
      } else {
        setError('HLS streaming is not supported in this browser.');
        setLoading(false);
      }
    } else {
      video.src = url;
      video.addEventListener('loadeddata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setLoading(false);
        setError('Failed to load stream. The URL may be invalid or the stream offline.');
      });
    }

    return () => {
      destroyHls();
    };
  }, [url, destroyHls]);

  const handleVolumeChange = () => {
    if (videoRef.current) {
      saveVolume(videoRef.current.volume);
    }
  };

  const handlePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP not supported
    }
  };

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-black">
      {channelName && (
        <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
          <p className="truncate text-sm font-medium text-white">{channelName}</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-sm text-gray-300">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <span className="text-4xl">📡</span>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full ${isFullscreen ? 'h-full object-contain' : 'aspect-video'}`}
        controls
        playsInline
        onVolumeChange={handleVolumeChange}
        onEnded={onStreamEnded}
      />

      <div className="flex items-center justify-end gap-2 bg-gray-900 px-3 py-1.5">
        <button
          onClick={handleFullscreen}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
        <button
          onClick={handlePiP}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          title="Picture in Picture"
          aria-label="Picture in Picture"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
