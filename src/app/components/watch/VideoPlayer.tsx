'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hls, { type Level } from 'hls.js';
import {
  Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, PictureInPicture2,
  Settings2, RotateCcw, SkipForward, Loader2, WifiOff, ShieldCheck, Check,
} from 'lucide-react';
import { cn, buildProxiedUrl } from '@/lib/utils';
import { getVolume, setVolume as saveVolume, getMuted, setMuted as saveMuted } from '@/lib/storage';
import ChannelLogo from '../ChannelLogo';
import { describeChannel } from '@/lib/m3uParser';

type Status = 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'blocked';

interface VideoPlayerProps {
  url: string;
  channelName: string;
  logo?: string;
  proxyUrl?: string;
  hasNext: boolean;
  onNext: () => void;
  onEnded?: () => void;
}

// A stream that has not started playing after this long is treated as offline
const START_TIMEOUT_MS = 25000;
const HIDE_CONTROLS_MS = 2800;
const PROGRESSIVE_RE = /\.(mp4|webm|ogv|ogg|mp3|m4a|aac|wav)(\?|#|$)/i;

function IconButton({
  label, onClick, children, className, pressed,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function VideoPlayer({
  url, channelName, logo, proxyUrl, hasNext, onNext, onEnded,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [autoMuted, setAutoMuted] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [level, setLevel] = useState(-1);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [isLive, setIsLive] = useState(true);

  // Restore volume once
  useEffect(() => {
    setVolume(getVolume());
    setMuted(getMuted());
    setPipSupported(typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled);
  }, []);

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
    } catch (e) {
      if ((e as DOMException)?.name !== 'NotAllowedError') return;
      // Browsers block unmuted autoplay without a user gesture: retry muted
      try {
        video.muted = true;
        await video.play();
        setAutoMuted(true);
      } catch {
        setStatus('blocked');
      }
    }
  }, []);

  // Load the stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');
    setError('');
    setLevels([]);
    setLevel(-1);
    setQualityOpen(false);
    setAutoMuted(false);
    video.muted = getMuted();
    video.volume = getVolume();

    let networkRetries = 0;
    let mediaRetries = 0;
    let started = false;
    const fail = (message: string) => {
      setError(message);
      setStatus('error');
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    const timeout = setTimeout(() => {
      if (!started) fail('This channel is not responding right now. It may be offline or blocked in your region.');
    }, START_TIMEOUT_MS);
    const onPlaying = () => { started = true; };
    video.addEventListener('playing', onPlaying);

    const proxied = (u: string) => buildProxiedUrl(u, proxyUrl);

    if (!PROGRESSIVE_RE.test(url) && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        backBufferLength: 30,
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 3,
        ...(proxyUrl
          ? { xhrSetup: (xhr: XMLHttpRequest, u: string) => xhr.open('GET', proxied(u), true) }
          : {}),
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels.length > 1 ? data.levels : []);
        tryPlay();
      });
      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => setIsLive(data.details.live));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 1 && data.details !== Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
          networkRetries++;
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
          if (mediaRetries === 1) hls.swapAudioCodec();
          mediaRetries++;
          hls.recoverMediaError();
        } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          const code = data.response?.code;
          fail(
            code === 403 || code === 451
              ? 'This stream refused the connection (it may be geo-blocked). Try enabling the proxy in Settings.'
              : 'Could not reach this stream. It may be offline right now.',
          );
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          fail('Your browser cannot decode this stream.');
        } else {
          fail('This stream could not be played.');
        }
      });
    } else if (!PROGRESSIVE_RE.test(url) && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxied(url);
      tryPlay();
    } else {
      video.src = proxied(url);
      tryPlay();
    }

    const onNativeError = () => {
      if (!hlsRef.current) fail('This stream could not be played.');
    };
    video.addEventListener('error', onNativeError);

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onNativeError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [url, proxyUrl, attempt, tryPlay]);

  // Mirror media element state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setStatus('playing');
    const onPause = () => setStatus((s) => (s === 'error' ? s : 'paused'));
    const onWaiting = () => setStatus((s) => (s === 'playing' ? 'buffering' : s));
    const onVolume = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onDuration = () => setIsLive(!Number.isFinite(video.duration) || hlsRef.current?.latestLevelDetails?.live === true);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('durationchange', onDuration);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('durationchange', onDuration);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Controls auto-hide while playing
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
        setQualityOpen(false);
      }
    }, HIDE_CONTROLS_MS);
  }, []);
  useEffect(() => {
    if (status === 'playing') revealControls();
    else setControlsVisible(true);
    return () => clearTimeout(hideTimer.current);
  }, [status, revealControls]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (status === 'error') return;
    if (video.paused) tryPlay();
    else video.pause();
  }, [status, tryPlay]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.5;
    saveMuted(video.muted);
    setAutoMuted(false);
  }, []);

  const changeVolume = (v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    saveVolume(v);
    saveMuted(video.muted);
    setAutoMuted(false);
  };

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
    else (videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen?.();
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // PiP refused (e.g. not playing yet)
    }
  }, []);

  const goLive = () => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video) return;
    if (hls?.liveSyncPosition) video.currentTime = hls.liveSyncPosition;
    if (video.paused) tryPlay();
  };

  const chooseLevel = (idx: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = idx;
    setLevel(idx);
    setQualityOpen(false);
  };

  // Player keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'k') {
        if (t?.closest('button, [role="option"]') && key === ' ') return;
        e.preventDefault();
        togglePlay();
      } else if (key === 'm') {
        toggleMute();
      } else if (key === 'f') {
        toggleFullscreen();
      } else if (key === 'p' && pipSupported) {
        togglePip();
      } else {
        return;
      }
      revealControls();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, toggleMute, toggleFullscreen, togglePip, pipSupported, revealControls]);

  const title = describeChannel(channelName).title;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const showOverlayControls = controlsVisible || status !== 'playing';
  const currentHeight = level >= 0 ? levels[level]?.height : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'group/player relative isolate w-full overflow-hidden bg-black',
        fullscreen ? 'h-full' : 'aspect-video rounded-2xl shadow-2xl shadow-black/30 ring-1 ring-white/5',
        !showOverlayControls && 'cursor-none',
      )}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onMouseLeave={() => status === 'playing' && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className="h-full w-full bg-black object-contain"
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onEnded={onEnded}
        aria-label={`${channelName} live stream`}
      />

      {/* Loading / buffering */}
      {(status === 'loading' || status === 'buffering') && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
          {status === 'loading' && <ChannelLogo name={channelName} logo={logo} className="h-16 w-16 text-2xl shadow-lg" />}
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white/90 backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin" />
            {status === 'loading' ? `Tuning in to ${title}…` : 'Buffering…'}
          </div>
        </div>
      )}

      {/* Autoplay blocked */}
      {status === 'blocked' && (
        <button
          type="button"
          onClick={() => { setStatus('loading'); tryPlay(); }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white"
          aria-label={`Play ${title}`}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition group-hover/player:scale-105">
            <Play className="ml-1 h-9 w-9 fill-current" />
          </span>
          <span className="text-sm font-medium">Tap to play</span>
        </button>
      )}

      {/* Error */}
      {status === 'error' && (
        <div
          data-player-error
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-black/70 to-black/90 p-6 text-center text-white"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <WifiOff className="h-7 w-7" />
          </span>
          <div className="max-w-sm space-y-1">
            <p className="text-base font-semibold">{title} is unavailable</p>
            <p className="text-sm text-white/70">{error}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                Next channel <SkipForward className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Muted autoplay notice */}
      {autoMuted && status === 'playing' && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-lg transition hover:bg-white/90 sm:left-4 sm:top-4"
        >
          <VolumeX className="h-4 w-4" /> Tap to unmute
        </button>
      )}

      {/* Top gradient + title (fullscreen) */}
      {fullscreen && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent p-5 transition-opacity duration-300',
            showOverlayControls ? 'opacity-100' : 'opacity-0',
          )}
        >
          <ChannelLogo name={channelName} logo={logo} className="h-10 w-10 text-sm" />
          <p className="text-lg font-semibold text-white">{title}</p>
        </div>
      )}

      {/* Bottom control bar */}
      {status !== 'error' && status !== 'blocked' && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-2 pt-12 transition-opacity duration-300 sm:px-3',
            showOverlayControls ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div className="flex items-center gap-1">
            <IconButton label={status === 'paused' ? 'Play (K)' : 'Pause (K)'} onClick={togglePlay}>
              {status === 'paused' ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
            </IconButton>

            <div className="group/vol flex items-center">
              <IconButton label={muted ? 'Unmute (M)' : 'Mute (M)'} onClick={toggleMute}>
                <VolumeIcon className="h-5 w-5" />
              </IconButton>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                aria-label="Volume"
                className="range hidden w-0 opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100 focus-visible:w-20 focus-visible:opacity-100 sm:block"
                style={{ backgroundSize: `${(muted ? 0 : volume) * 100}% 100%` }}
              />
            </div>

            {isLive && (
              <button
                type="button"
                onClick={goLive}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10"
                title="Jump to live"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                </span>
                Live
              </button>
            )}

            <div className="flex-1" />

            {proxyUrl && (
              <span className="mr-1 hidden items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex" title="Requests go through your CORS proxy">
                <ShieldCheck className="h-3 w-3" /> Proxy
              </span>
            )}

            {levels.length > 0 && (
              <div className="relative">
                <IconButton label="Quality" onClick={() => setQualityOpen((o) => !o)} pressed={qualityOpen}>
                  <Settings2 className="h-5 w-5" />
                </IconButton>
                {currentHeight && (
                  <span className="pointer-events-none absolute -right-0.5 top-0.5 rounded bg-primary px-1 text-[9px] font-bold leading-tight text-primary-foreground">
                    {currentHeight >= 720 ? 'HD' : `${currentHeight}p`}
                  </span>
                )}
                {qualityOpen && (
                  <div role="menu" className="absolute bottom-12 right-0 min-w-36 overflow-hidden rounded-xl bg-black/90 py-1 text-sm text-white shadow-xl ring-1 ring-white/10 backdrop-blur">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">Quality</p>
                    {[{ idx: -1, label: 'Auto' }, ...levels
                      .map((l, idx) => ({ idx, label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kbps`, h: l.height }))
                      .sort((a, b) => (b.h || 0) - (a.h || 0))].map((o) => (
                      <button
                        key={o.idx}
                        role="menuitemradio"
                        aria-checked={level === o.idx}
                        type="button"
                        onClick={() => chooseLevel(o.idx)}
                        className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left hover:bg-white/10"
                      >
                        {o.label}
                        {level === o.idx && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {pipSupported && (
              <IconButton label="Picture in picture (P)" onClick={togglePip}>
                <PictureInPicture2 className="h-5 w-5" />
              </IconButton>
            )}
            <IconButton label={fullscreen ? 'Exit full screen (F)' : 'Full screen (F)'} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
