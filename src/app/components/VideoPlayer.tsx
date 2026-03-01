'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { getVolume, setVolume as saveVolume } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, PictureInPicture2, Loader2, Satellite } from 'lucide-react';

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
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10">
      {channelName && (
        <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
          <p className="truncate text-sm font-medium text-white drop-shadow-sm">{channelName}</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-gray-300">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3 px-4 text-center">
            <Satellite className="h-10 w-10 text-red-400" />
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

      <div className="flex items-center justify-end gap-1 bg-gray-900/95 px-2 py-1 sm:px-3 sm:py-1.5 sm:gap-2">
        <Button
          onClick={handleFullscreen}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={handlePiP}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
          title="Picture in Picture"
          aria-label="Picture in Picture"
        >
          <PictureInPicture2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
