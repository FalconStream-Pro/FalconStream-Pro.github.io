'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star, X, History, ListVideo } from 'lucide-react';
import { Channel, describeChannel } from '@/lib/m3uParser';
import { cn } from '@/lib/utils';
import ChannelLogo from '../ChannelLogo';

type Tab = 'all' | 'favorites' | 'recent';

interface ChannelListProps {
  channels: Channel[];
  activeId: string;
  favoriteIds: Set<string>;
  recentIds: string[];
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
}

export default function ChannelList({
  channels, activeId, favoriteIds, recentIds, onSelect, onToggleFavorite,
}: ChannelListProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [group, setGroup] = useState('');
  const activeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    channels.forEach((c) => counts.set(c.group, (counts.get(c.group) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [channels]);

  const filtered = useMemo(() => {
    let list = channels;
    if (tab === 'favorites') list = list.filter((c) => favoriteIds.has(c.id));
    if (tab === 'recent') {
      const order = new Map(recentIds.map((id, i) => [id, i]));
      list = list.filter((c) => order.has(c.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    }
    if (group) list = list.filter((c) => c.group === group);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    return list;
  }, [channels, tab, group, query, favoriteIds, recentIds]);

  // Keep the playing channel in view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  // "/" focuses the channel search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || (e.target as HTMLElement)?.closest('input, textarea')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof ListVideo; count: number }[] = [
    { id: 'all', label: 'All', icon: ListVideo, count: channels.length },
    { id: 'favorites', label: 'Favorites', icon: Star, count: channels.filter((c) => favoriteIds.has(c.id)).length },
    { id: 'recent', label: 'Recent', icon: History, count: channels.filter((c) => recentIds.includes(c.id)).length },
  ];

  const moveFocus = (e: React.KeyboardEvent<HTMLDivElement>, channel: Channel) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(channel);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    e.stopPropagation();
    const sibling = e.key === 'ArrowDown'
      ? e.currentTarget.nextElementSibling
      : e.currentTarget.previousElementSibling;
    (sibling as HTMLElement | null)?.focus();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${channels.length} channels`}
            aria-label="Search channels"
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-[10px] text-muted-foreground sm:block">/</kbd>
          )}
        </div>

        <div role="tablist" aria-label="Channel views" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition',
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className={cn('h-3.5 w-3.5', t.id === 'favorites' && tab === t.id && 'fill-amber-400 text-amber-400')} />
              {t.label}
              {t.count > 0 && <span className="tabular-nums text-muted-foreground">{t.count}</span>}
            </button>
          ))}
        </div>

        {groups.length > 1 && (
          <div className="scrollbar-hide fade-x -mx-3 flex gap-1.5 overflow-x-auto px-3">
            <button type="button" className="chip" aria-pressed={group === ''} onClick={() => setGroup('')}>
              All groups
            </button>
            {groups.map(([g, n]) => (
              <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(group === g ? '' : g)}>
                {g}
                <span className="tabular-nums opacity-60">{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div role="listbox" aria-label="Channel list" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            {tab === 'favorites' ? <Star className="h-8 w-8 text-muted-foreground/40" /> : <Search className="h-8 w-8 text-muted-foreground/40" />}
            <p className="text-sm font-medium text-foreground">
              {query ? 'No channels match your search' : tab === 'favorites' ? 'No favorites yet' : tab === 'recent' ? 'Nothing watched yet' : 'No channels'}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === 'favorites' && !query ? 'Tap the star next to a channel to keep it here.' : 'Try a different search or group.'}
            </p>
          </div>
        ) : (
          filtered.map((channel) => {
            const active = channel.id === activeId;
            const fav = favoriteIds.has(channel.id);
            const { title, tags } = describeChannel(channel.name);
            return (
              <div
                key={channel.id}
                ref={active ? activeRef : undefined}
                role="option"
                tabIndex={0}
                aria-selected={active}
                onClick={() => onSelect(channel)}
                onKeyDown={(e) => moveFocus(e, channel)}
                className={cn(
                  'group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 outline-none transition',
                  active ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted focus-visible:bg-muted',
                )}
              >
                <ChannelLogo name={channel.name} logo={channel.logo} className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-medium', active ? 'text-primary' : 'text-foreground')} title={channel.name}>
                    {title}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {active && (
                      <span className="eq" aria-label="Now playing"><span /><span /><span /></span>
                    )}
                    <span className="truncate">
                      {[channel.group !== 'Uncategorized' ? channel.group : '', ...tags.filter((t) => t !== title)].filter(Boolean).join(' · ')}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(channel);
                  }}
                  aria-label={fav ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`}
                  aria-pressed={fav}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-background',
                    fav ? 'text-amber-400' : 'text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100',
                  )}
                >
                  <Star className={cn('h-4 w-4', fav && 'fill-current')} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
