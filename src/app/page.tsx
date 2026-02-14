'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseM3U, Channel } from '@/lib/m3uParser';
import {
  getConsent,
  setConsent,
  getFavorites,
  toggleFavorite,
  getRecent,
  addRecent,
  getTheme,
  setTheme as saveTheme,
} from '@/lib/storage';
import ConsentModal from './components/ConsentModal';
import UploadZone from './components/UploadZone';
import VideoPlayer from './components/VideoPlayer';
import ChannelList from './components/ChannelList';

export default function Home() {
  const [consented, setConsented] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration
  useEffect(() => {
    setMounted(true);
    setConsented(getConsent());
    setFavoritesState(getFavorites());
    setRecentIds(getRecent().map((r) => r.id));
    const t = getTheme();
    setThemeState(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const handleConsent = () => {
    setConsent(true);
    setConsented(true);
  };

  const handleFileLoaded = useCallback((content: string) => {
    const parsed = parseM3U(content);
    setChannels(parsed);
    if (parsed.length > 0) {
      setActiveChannel(parsed[0]);
      addRecent(parsed[0].id, parsed[0].name);
      setRecentIds(getRecent().map((r) => r.id));
    }
    setSidebarOpen(false);
  }, []);

  const handleChannelSelect = useCallback((channel: Channel) => {
    setActiveChannel(channel);
    addRecent(channel.id, channel.name);
    setRecentIds(getRecent().map((r) => r.id));
    // On mobile, close sidebar when channel is selected
    setSidebarOpen(false);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    const updated = toggleFavorite(id);
    setFavoritesState(updated);
  }, []);

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    saveTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleReset = () => {
    setChannels([]);
    setActiveChannel(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!channels.length || !activeChannel) return;
      const idx = channels.findIndex((ch) => ch.id === activeChannel.id);
      if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        handleChannelSelect(channels[idx - 1]);
      } else if (e.key === 'ArrowDown' && idx < channels.length - 1) {
        e.preventDefault();
        handleChannelSelect(channels[idx + 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [channels, activeChannel, handleChannelSelect]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!consented) {
    return (
      <div className="dark">
        <ConsentModal onAccept={handleConsent} />
      </div>
    );
  }

  // Upload state - no channels loaded yet
  if (channels.length === 0) {
    return (
      <div className={theme}>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-950">
          {/* Header */}
          <div className="mb-8 flex items-center gap-2">
            <button
              onClick={handleThemeToggle}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              🦅 FalconStream Pro
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload an M3U playlist to start streaming
            </p>
          </div>

          <UploadZone onFileLoaded={handleFileLoaded} onUrlLoaded={handleFileLoaded} />
        </div>
      </div>
    );
  }

  // Player state - channels loaded
  return (
    <div className={theme}>
      <div className="flex h-screen flex-col bg-white dark:bg-gray-950">
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Toggle channel list"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
              🦅 FalconStream Pro
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 sm:px-3 sm:text-sm"
            >
              New Playlist
            </button>
            <button
              onClick={handleThemeToggle}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          {/* Sidebar - Channel List */}
          {/* Desktop: always visible | Mobile: overlay */}
          <aside
            className={`absolute inset-y-0 left-0 z-30 w-72 transform border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-950 sm:w-80 lg:relative lg:z-auto lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <ChannelList
              channels={channels}
              activeId={activeChannel?.id || ''}
              favorites={favorites}
              recentIds={recentIds}
              onSelect={handleChannelSelect}
              onToggleFavorite={handleToggleFavorite}
            />
          </aside>

          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div
              className="absolute inset-0 z-20 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content - Player */}
          <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-3 sm:p-6">
            {activeChannel ? (
              <div className="w-full max-w-4xl">
                <VideoPlayer
                  url={activeChannel.url}
                  channelName={activeChannel.name}
                />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                      {activeChannel.name}
                    </h2>
                    {activeChannel.group && activeChannel.group !== 'Uncategorized' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeChannel.group}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(activeChannel.id)}
                    className="shrink-0 rounded-lg p-2 text-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label={
                      favorites.includes(activeChannel.id)
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    {favorites.includes(activeChannel.id) ? '⭐' : '☆'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Select a channel to start watching
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
