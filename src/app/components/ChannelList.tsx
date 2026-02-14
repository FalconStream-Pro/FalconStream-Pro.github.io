'use client';

import { useMemo, useCallback, useState } from 'react';
import { Channel } from '@/lib/m3uParser';
import SearchBar from './SearchBar';

type TabType = 'all' | 'favorites' | 'recent';

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
      list.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
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

    return list;
  }, [channels, search, tab, selectedGroup, favorites, recentIds]);

  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent, channel: Channel) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(channel);
      }
    },
    [onSelect]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['all', 'favorites', 'recent'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t === 'favorites' ? '⭐ Favorites' : t === 'recent' ? '🕐 Recent' : '📺 All'}
          </button>
        ))}
      </div>

      {/* Search + Group Filter */}
      <div className="space-y-2 p-3">
        <SearchBar value={search} onChange={setSearch} channelCount={channels.length} />
        {groups.length > 1 && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">All Categories ({groups.length})</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Channel list">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-3xl">📺</span>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
              role="option"
              tabIndex={0}
              aria-selected={activeId === channel.id}
              onClick={() => onSelect(channel)}
              onKeyDown={(e) => handleKeyNav(e, channel)}
              className={`group flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2.5 transition-colors dark:border-gray-800 ${
                activeId === channel.id
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-200 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  TV
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    activeId === channel.id
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {channel.name}
                </p>
                {channel.group && channel.group !== 'Uncategorized' && (
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                    {channel.group}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(channel.id);
                }}
                className="shrink-0 p-1 text-gray-300 transition-colors hover:text-yellow-500 dark:text-gray-600 dark:hover:text-yellow-400"
                aria-label={
                  favorites.includes(channel.id)
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                {favorites.includes(channel.id) ? (
                  <span className="text-yellow-500">★</span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100">☆</span>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 px-3 py-2 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
        {filtered.length} of {channels.length} channels
      </div>
    </div>
  );
}
