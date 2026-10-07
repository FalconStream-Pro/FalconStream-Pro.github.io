'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, Tv, ListVideo, Star, History, CornerDownLeft } from 'lucide-react';
import type { Channel } from '@/lib/m3uParser';
import { presetPlaylists, type PresetPlaylist } from '@/lib/presetPlaylists';
import type { SavedChannel } from '@/lib/storage';
import { cn } from '@/lib/utils';
import ChannelLogo from './ChannelLogo';

type Item =
  | { kind: 'channel'; key: string; channel: Channel }
  | { kind: 'saved'; key: string; saved: SavedChannel; source: 'favorite' | 'recent' }
  | { kind: 'playlist'; key: string; preset: PresetPlaylist };

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: Channel[];
  favorites: SavedChannel[];
  recent: SavedChannel[];
  onChannel: (channel: Channel) => void;
  onSaved: (saved: SavedChannel) => void;
  onPlaylist: (preset: PresetPlaylist) => void;
}

const MAX_PER_SECTION = 8;

export default function CommandPalette({
  open, onOpenChange, channels, favorites, recent, onChannel, onSaved, onPlaylist,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);
    const out: { title: string; icon: typeof Tv; items: Item[] }[] = [];

    const ch = channels.filter((c) => match(c.name) || match(c.group)).slice(0, MAX_PER_SECTION);
    if (ch.length) out.push({ title: 'Channels in this playlist', icon: Tv, items: ch.map((c) => ({ kind: 'channel', key: `c-${c.id}`, channel: c })) });

    const fav = favorites.filter((f) => match(f.name)).slice(0, MAX_PER_SECTION);
    if (fav.length) out.push({ title: 'Favorites', icon: Star, items: fav.map((s) => ({ kind: 'saved', key: `f-${s.id}`, saved: s, source: 'favorite' })) });

    if (!q) {
      const rec = recent.slice(0, 5);
      if (rec.length) out.push({ title: 'Recently watched', icon: History, items: rec.map((s) => ({ kind: 'saved', key: `r-${s.id}`, saved: s, source: 'recent' })) });
    }

    const pl = presetPlaylists.filter((p) => match(p.name) || match(p.region || '') || match(p.description)).slice(0, q ? 12 : 6);
    if (pl.length) out.push({ title: 'Playlists', icon: ListVideo, items: pl.map((p) => ({ kind: 'playlist', key: `p-${p.id}`, preset: p })) });
    return out;
  }, [query, channels, favorites, recent]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const run = (item: Item) => {
    onOpenChange(false);
    if (item.kind === 'channel') onChannel(item.channel);
    else if (item.kind === 'saved') onSaved(item.saved);
    else onPlaylist(item.preset);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault();
      run(flat[cursor]);
    }
  };

  let index = -1;
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search channels in the current playlist, your favorites and all playlists
          </DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels, favorites, countries…"
              aria-label="Search"
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Esc</kbd>
          </div>

          <div ref={listRef} className="scrollbar-thin max-h-[60vh] overflow-y-auto p-2">
            {flat.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No results for “{query}”.</p>
            )}
            {sections.map((section) => (
              <div key={section.title} className="pb-2">
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <section.icon className="h-3 w-3" /> {section.title}
                </p>
                {section.items.map((item) => {
                  index++;
                  const i = index;
                  const active = i === cursor;
                  const name = item.kind === 'channel' ? item.channel.name : item.kind === 'saved' ? item.saved.name : item.preset.name;
                  const sub = item.kind === 'channel'
                    ? item.channel.group
                    : item.kind === 'saved'
                      ? item.saved.playlistName || item.saved.group
                      : `${item.preset.region} · ${item.preset.description}`;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-active={active}
                      onMouseMove={() => setCursor(i)}
                      onClick={() => run(item)}
                      className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left', active && 'bg-muted')}
                    >
                      {item.kind === 'playlist' ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">{item.preset.icon}</span>
                      ) : (
                        <ChannelLogo
                          name={name}
                          logo={item.kind === 'channel' ? item.channel.logo : item.saved.logo}
                          className="h-9 w-9 text-xs"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
                      </span>
                      {active && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
