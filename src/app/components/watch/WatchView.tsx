'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Star, Share2, Repeat, ArrowLeft } from 'lucide-react';
import { Channel, describeChannel } from '@/lib/m3uParser';
import { cn } from '@/lib/utils';
import VideoPlayer from './VideoPlayer';
import YouTubePlayer from './YouTubePlayer';
import { isYouTube } from '@/lib/youtube';
import ChannelList from './ChannelList';
import ChannelLogo from '../ChannelLogo';
import { showToast } from '../Toast';

interface WatchViewProps {
  playlistName: string;
  shareable: boolean;
  channels: Channel[];
  active: Channel;
  favoriteIds: Set<string>;
  recentIds: string[];
  autoPlay: boolean;
  proxyUrl?: string;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  onToggleAutoPlay: () => void;
  onBack: () => void;
}

export default function WatchView({
  playlistName, shareable, channels, active, favoriteIds, recentIds, autoPlay, proxyUrl,
  onSelect, onToggleFavorite, onToggleAutoPlay, onBack,
}: WatchViewProps) {
  const index = useMemo(() => channels.findIndex((c) => c.id === active.id), [channels, active.id]);
  const prev = index > 0 ? channels[index - 1] : undefined;
  const next = index >= 0 && index < channels.length - 1 ? channels[index + 1] : undefined;
  const isFav = favoriteIds.has(active.id);
  const { title, tags } = describeChannel(active.name);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `${title} – FalconStream Pro`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard', 'success');
    } catch {
      // Share sheet dismissed
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-3 pb-6 pt-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:pt-6">
      <section aria-label="Player" className="min-w-0 space-y-4">
        <div className="lg:sticky lg:top-20">
          {isYouTube(active.url) ? (
            <YouTubePlayer url={active.url} channelName={active.name} />
          ) : (
            <VideoPlayer
              url={active.url}
              channelName={active.name}
              logo={active.logo}
              proxyUrl={proxyUrl}
              hasNext={!!next}
              onNext={() => next && onSelect(next)}
              onEnded={() => autoPlay && next && onSelect(next)}
            />
          )}

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ChannelLogo name={active.name} logo={active.logo} className="h-12 w-12 text-base sm:h-14 sm:w-14" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-live">
                    <span className="h-1.5 w-1.5 rounded-full bg-live" /> Live
                  </span>
                  {active.group !== 'Uncategorized' && <span>{active.group}</span>}
                  {tags.map((t) => (
                    <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">{t}</span>
                  ))}
                  <span className="hidden sm:inline">· {index + 1} of {channels.length} in {playlistName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => prev && onSelect(prev)}
                disabled={!prev}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40"
                aria-label="Previous channel"
                title={prev ? `Previous: ${prev.name} (↑)` : 'Previous channel'}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => next && onSelect(next)}
                disabled={!next}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-40"
                aria-label="Next channel"
                title={next ? `Next: ${next.name} (↓)` : 'Next channel'}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(active)}
                aria-pressed={isFav}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition',
                  isFav
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-500 dark:text-amber-300'
                    : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                <Star className={cn('h-4 w-4', isFav && 'fill-current')} />
                <span className="hidden sm:inline">{isFav ? 'Favorited' : 'Favorite'}</span>
              </button>
              {shareable && (
                <button
                  type="button"
                  onClick={share}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
                  aria-label="Share this channel"
                  title="Copy link to this channel"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium hover:bg-muted hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> All playlists
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted">
              <Repeat className="h-3.5 w-3.5" />
              Auto-advance when a stream ends
              <button
                type="button"
                role="switch"
                aria-checked={autoPlay}
                aria-label="Auto-advance to the next channel"
                onClick={onToggleAutoPlay}
                className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition', autoPlay ? 'bg-primary' : 'bg-input')}
              >
                <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition', autoPlay ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
            </label>
          </div>
        </div>
      </section>

      <aside
        aria-label="Channels"
        className="surface-card flex h-[70vh] min-h-[420px] flex-col overflow-hidden lg:sticky lg:top-20 lg:h-[calc(100dvh-6.5rem)]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{playlistName}</p>
            <p className="text-xs text-muted-foreground">{channels.length} channels</p>
          </div>
        </div>
        <ChannelList
          channels={channels}
          activeId={active.id}
          favoriteIds={favoriteIds}
          recentIds={recentIds}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      </aside>
    </div>
  );
}
