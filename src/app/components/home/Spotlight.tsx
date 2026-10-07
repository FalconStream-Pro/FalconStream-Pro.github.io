'use client';

import { useEffect, useState } from 'react';
import { Play, Loader2, Radio, CheckCircle2 } from 'lucide-react';
import { parseM3U, Channel } from '@/lib/m3uParser';
import type { PresetPlaylist } from '@/lib/presetPlaylists';
import ChannelLogo from '../ChannelLogo';

interface SpotlightProps {
  preset: PresetPlaylist;
  loading: boolean;
  disabled: boolean;
  onWatch: (preset: PresetPlaylist, channelId?: string) => void;
}

/** Hero card for the self-hosted, tested playlist (Sri Lanka). */
export default function Spotlight({ preset, loading, disabled, onWatch }: SpotlightProps) {
  const [channels, setChannels] = useState<Channel[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(preset.url)
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => !cancelled && setChannels(parseM3U(t)))
      .catch(() => !cancelled && setChannels([]));
    return () => {
      cancelled = true;
    };
  }, [preset.url]);

  return (
    <section
      aria-labelledby="spotlight-title"
      className="relative overflow-hidden rounded-3xl border border-border bg-card"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_0%_0%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(30rem_18rem_at_100%_100%,rgba(244,63,94,0.18),transparent_60%)]" />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:p-10">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            Live now · {preset.icon} {preset.name}
          </span>
          <div className="space-y-3">
            <h1 id="spotlight-title" className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Sri Lankan TV, live in your browser.
            </h1>
            <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              {channels && channels.length > 0
                ? `${channels.length} channels, checked automatically every week so the list only holds streams that actually play.`
                : 'A hand-checked list of Sri Lankan channels, tested automatically every week.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onWatch(preset)}
              disabled={disabled}
              aria-label={`Load ${preset.name}`}
              aria-busy={loading}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background shadow-lg transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Start watching
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free · No sign-up
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {channels === null
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)
            : channels.slice(0, 8).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onWatch(preset, c.id)}
                disabled={disabled}
                className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 p-2 text-center backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg disabled:opacity-60"
                aria-label={`Watch ${c.name}`}
                title={c.name}
              >
                <ChannelLogo name={c.name} logo={c.logo} className="h-10 w-10 text-sm sm:h-12 sm:w-12" />
                <span className="line-clamp-1 w-full text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                  {c.name.replace(/\s*[([].*$/, '')}
                </span>
              </button>
            ))}
          {channels !== null && channels.length === 0 && (
            <div className="col-span-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
              <Radio className="h-4 w-4" /> Channel preview unavailable
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
