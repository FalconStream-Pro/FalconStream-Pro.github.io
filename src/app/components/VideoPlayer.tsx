'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { getVolume, setVolume as saveVolume } from '@/lib/storage';

interface VideoPlayerProps {
  url: string;
  channelName: string;
}

export default function VideoPlayer({ url, channelName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
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
        className="aspect-video w-full"
        controls
        playsInline
        onVolumeChange={handleVolumeChange}
      />

      <div className="flex items-center justify-end gap-2 bg-gray-900 px-3 py-1.5">
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
