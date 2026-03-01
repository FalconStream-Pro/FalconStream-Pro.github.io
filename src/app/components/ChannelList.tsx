'use client';

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Channel } from '@/lib/m3uParser';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

type TabType = 'all' | 'favorites' | 'recent';
type SortType = 'default' | 'az' | 'za' | 'group';

interface ChannelListProps {
  channels: Channel[];
  activeId: string;
  favorites: string[];
  recentIds: string[];
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
}

export default function ChannelList({
  channels,
  activeId,
  favorites,
  recentIds,
  onSelect,
  onToggleFavorite,
}: ChannelListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabType>('all');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortType>('default');
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const g = new Set<string>();
    channels.forEach((ch) => g.add(ch.group));
    return Array.from(g).sort();
  }, [channels]);

  const filtered = useMemo(() => {
    let list = channels;

    if (tab === 'favorites') {
      list = list.filter((ch) => favorites.includes(ch.id));
    } else if (tab === 'recent') {
      list = list.filter((ch) => recentIds.includes(ch.id));
      list = [...list].sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    }

    if (selectedGroup) {
      list = list.filter((ch) => ch.group === selectedGroup);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          ch.group.toLowerCase().includes(q)
      );
    }

    // Apply sorting (only for non-recent tabs)
    if (tab !== 'recent' && sort !== 'default') {
      list = [...list];
      switch (sort) {
        case 'az':
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'za':
          list.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'group':
          list.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
          break;
      }
    }

    return list;
  }, [channels, search, tab, selectedGroup, favorites, recentIds, sort]);

  // Scroll to active channel when it changes
  useEffect(() => {
    if (activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeId]);

  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent, channel: Channel) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(channel);
      }
    },
    [onSelect]
  );

  const tabItems: { value: TabType; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📺' },
    { value: 'favorites', label: 'Favorites', icon: '⭐' },
    { value: 'recent', label: 'Recent', icon: '🕐' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabItems.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 px-2 py-2.5 text-xs font-medium transition-colors sm:px-3",
              tab === t.value
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search + Group Filter + Sort */}
      <div className="space-y-2 p-3">
        <SearchBar value={search} onChange={setSearch} channelCount={channels.length} />
        <div className="flex gap-2">
          {groups.length > 1 && (
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Categories ({groups.length})</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Sort channels"
          >
            <option value="default">Default</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="group">By Group</option>
          </select>
        </div>
      </div>

      {/* Channel List */}
      <div ref={listRef} className="flex-1 overflow-y-auto" role="listbox" aria-label="Channel list">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-3xl">📺</span>
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === 'favorites'
                ? 'No favorite channels yet'
                : tab === 'recent'
                ? 'No recently played channels'
                : 'No channels found'}
            </p>
          </div>
        ) : (
          filtered.map((channel) => (
            <div
              key={channel.id}
              ref={activeId === channel.id ? activeRef : undefined}
              role="option"
              tabIndex={0}
              aria-selected={activeId === channel.id}
              onClick={() => onSelect(channel)}
              onKeyDown={(e) => handleKeyNav(e, channel)}
              className={cn(
                "group flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-2.5 transition-colors",
                activeId === channel.id
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-muted/50'
              )}
            >
              {channel.logo && !brokenLogos.has(channel.id) ? (
                <img
                  src={channel.logo}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-md object-contain"
                  onError={() => {
                    setBrokenLogos((prev) => new Set(prev).add(channel.id));
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  TV
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    activeId === channel.id
                      ? 'text-primary'
                      : 'text-foreground'
                  )}
                >
                  {channel.name}
                </p>
                {channel.group && channel.group !== 'Uncategorized' && (
                  <p className="truncate text-xs text-muted-foreground">
                    {channel.group}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(channel.id);
                }}
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-muted"
                aria-label={
                  favorites.includes(channel.id)
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                {favorites.includes(channel.id) ? (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ) : (
                  <Star className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border px-3 py-2 text-center">
        <Badge variant="secondary" className="text-xs">
          {filtered.length} of {channels.length} channels
        </Badge>
      </div>
    </div>
  );
}
