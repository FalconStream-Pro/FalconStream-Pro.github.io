'use client';

import { useMemo, useState } from 'react';
import { Search, X, Loader2, Compass, ArrowUpRight } from 'lucide-react';
import { presetPlaylists, presetRegions, type PresetPlaylist } from '@/lib/presetPlaylists';
import { cn } from '@/lib/utils';

interface PlaylistBrowserProps {
  loadingId: string | null;
  onSelect: (preset: PresetPlaylist) => void;
}

export default function PlaylistBrowser({ loadingId, onSelect }: PlaylistBrowserProps) {
  const [region, setRegion] = useState('');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presetPlaylists.filter(
      (p) =>
        (!region || p.region === region) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.region || '').toLowerCase().includes(q)),
    );
  }, [region, query]);

  return (
    <section aria-labelledby="browse-title" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="browse-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            <Compass className="h-5 w-5 text-primary" /> Browse the world
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {presetPlaylists.length} public playlists by country and category, from the community-run iptv-org project.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries & categories"
            aria-label="Search playlists"
            className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="scrollbar-hide fade-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <button type="button" className="chip" aria-pressed={region === ''} onClick={() => setRegion('')}>
          All
        </button>
        {presetRegions.map((r) => (
          <button key={r} type="button" className="chip" aria-pressed={region === r} onClick={() => setRegion(region === r ? '' : r)}>
            {r}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No playlists match “{query}”</p>
          <p className="text-xs text-muted-foreground">Try a country name like “India” or a category like “News”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((preset) => {
            const loading = loadingId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelect(preset)}
                disabled={loadingId !== null}
                aria-label={`Load ${preset.name}`}
                aria-busy={loading}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3 text-left transition sm:gap-3 sm:p-4',
                  'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg disabled:pointer-events-none',
                  loadingId !== null && !loading && 'opacity-50',
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xl transition group-hover:scale-105 sm:h-11 sm:w-11 sm:text-2xl">
                  {preset.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground sm:text-sm" title={preset.name}>{preset.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{preset.region}</span>
                </span>
                {loading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 sm:block" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
