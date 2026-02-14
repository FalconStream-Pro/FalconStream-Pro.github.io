'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseM3U, Channel } from '@/lib/m3uParser';
import { presetPlaylists, PresetPlaylist } from '@/lib/presetPlaylists';
import {
  getConsent,
  setConsent,
  getFavorites,
  toggleFavorite,
  getRecent,
  addRecent,
  getTheme,
  setTheme as saveTheme,
  getAutoPlay,
  setAutoPlay as saveAutoPlay,
} from '@/lib/storage';
import ConsentModal from './components/ConsentModal';
import UploadZone from './components/UploadZone';
import VideoPlayer from './components/VideoPlayer';
import ChannelList from './components/ChannelList';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';

const LOGO_URL =
  'https://res.cloudinary.com/dkj22lm1g/image/upload/v1771081619/FalconStream-Pro_jqpcgb.webp';

export default function Home() {
  const [consented, setConsented] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [presetError, setPresetError] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [autoPlay, setAutoPlayState] = useState(false);
  const [presetRegionFilter, setPresetRegionFilter] = useState('');
  const [presetSearch, setPresetSearch] = useState('');

  // Group presets by region
  const presetRegions = useMemo(() => {
    const regions = new Map<string, PresetPlaylist[]>();
    presetPlaylists.forEach((p) => {
      const region = p.region || 'Other';
      if (!regions.has(region)) regions.set(region, []);
      regions.get(region)!.push(p);
    });
    return regions;
  }, []);

  const filteredPresets = useMemo(() => {
    let list = presetPlaylists;
    if (presetRegionFilter) {
      list = list.filter((p) => p.region === presetRegionFilter);
    }
    if (presetSearch.trim()) {
      const q = presetSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [presetRegionFilter, presetSearch]);

  // Hydration
  useEffect(() => {
    setMounted(true);
    setConsented(getConsent());
    setFavoritesState(getFavorites());
    setRecentIds(getRecent().map((r) => r.id));
    setAutoPlayState(getAutoPlay());
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

  const handleAutoPlayToggle = () => {
    const next = !autoPlay;
    setAutoPlayState(next);
    saveAutoPlay(next);
  };

  // Auto-play next channel on stream end
  const handleStreamEnded = useCallback(() => {
    if (!autoPlay || !activeChannel || !channels.length) return;
    const idx = channels.findIndex((ch) => ch.id === activeChannel.id);
    if (idx >= 0 && idx < channels.length - 1) {
      const nextCh = channels[idx + 1];
      setActiveChannel(nextCh);
      addRecent(nextCh.id, nextCh.name);
      setRecentIds(getRecent().map((r) => r.id));
    }
  }, [autoPlay, activeChannel, channels]);

  const handlePresetSelect = useCallback(async (preset: PresetPlaylist) => {
    setLoadingPreset(preset.id);
    setPresetError('');
    try {
      const res = await fetch(preset.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseM3U(text);
      if (parsed.length === 0) {
        setPresetError('No channels found in this playlist. It may be temporarily unavailable.');
        return;
      }
      setChannels(parsed);
      setActiveChannel(parsed[0]);
      addRecent(parsed[0].id, parsed[0].name);
      setRecentIds(getRecent().map((r) => r.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPresetError(`Failed to load playlist: ${message}. Please try again or check your connection.`);
    } finally {
      setLoadingPreset(null);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }
      if (e.key === 't') {
        handleThemeToggle();
        return;
      }
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        const video = document.querySelector('video');
        if (video) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.closest('.relative')?.requestFullscreen();
          }
        }
        return;
      }

      if (!channels.length || !activeChannel) return;
      const idx = channels.findIndex((ch) => ch.id === activeChannel.id);
      if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        handleChannelSelect(channels[idx - 1]);
      } else if (e.key === 'ArrowDown' && idx < channels.length - 1) {
        e.preventDefault();
        handleChannelSelect(channels[idx + 1]);
      } else if (e.key === 'm') {
        const video = document.querySelector('video');
        if (video) video.muted = !video.muted;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, activeChannel, handleChannelSelect, theme]);

  if (!mounted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950">
        <img
          src={LOGO_URL}
          alt="FalconStream Pro - Loading"
          className="mb-4 h-16 w-16 rounded-xl object-contain animate-pulse"
        />
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
        <div className="flex min-h-screen flex-col items-center bg-white dark:bg-gray-950">
          {/* Header */}
          <div className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
            <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              <img src={LOGO_URL} alt="FalconStream Pro" className="h-8 w-8 rounded-lg object-contain" />
              FalconStream Pro
            </h1>
            <button
              onClick={handleThemeToggle}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="w-full max-w-5xl px-4 py-8">
            <div className="mb-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse {presetPlaylists.length} preset channel collections from around the world, or upload your own M3U playlist
              </p>
            </div>

            {/* Region filter + Search */}
            <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search countries & categories..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setPresetRegionFilter('')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    presetRegionFilter === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {Array.from(presetRegions.keys()).map((region) => (
                  <button
                    key={region}
                    onClick={() => setPresetRegionFilter(region === presetRegionFilter ? '' : region)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      presetRegionFilter === region
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Channel Cards */}
            <div className="mb-8">
              {filteredPresets.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No playlists match your search.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      disabled={loadingPreset !== null}
                      aria-label={`Load ${preset.name}`}
                      aria-busy={loadingPreset === preset.id}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
                    >
                      <span className="text-3xl transition-transform group-hover:scale-110">{preset.icon}</span>
                      <div className="min-w-0 w-full">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {preset.name}
                        </p>
                        {preset.region && (
                          <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                            {preset.region}
                          </p>
                        )}
                      </div>
                      {loadingPreset === preset.id && (
                        <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {presetError && (
                <p className="mt-3 text-center text-sm text-red-500">{presetError}</p>
              )}
            </div>

            <div className="mb-6 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">or upload your own</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <UploadZone onFileLoaded={handleFileLoaded} onUrlLoaded={handleFileLoaded} />
          </div>

          {/* Footer */}
          <footer className="mt-auto w-full border-t border-gray-200 py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            <p>FalconStream Pro — {presetPlaylists.length} preset collections • Open source M3U/HLS player</p>
            <p className="mt-1">Press <kbd className="rounded border border-gray-300 px-1 py-0.5 font-mono text-xs dark:border-gray-600">?</kbd> for keyboard shortcuts</p>
          </footer>
        </div>

        {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}
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
            <h1 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
              <img src={LOGO_URL} alt="FalconStream Pro" className="h-7 w-7 rounded object-contain" />
              <span className="hidden sm:inline">FalconStream Pro</span>
            </h1>
            <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:inline">
              {channels.length} channels
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Auto-play toggle */}
            <button
              onClick={handleAutoPlayToggle}
              className={`rounded-lg px-2 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm ${
                autoPlay
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
              title={autoPlay ? 'Auto-play is ON' : 'Auto-play is OFF'}
              aria-label="Toggle auto-play next channel"
            >
              {autoPlay ? '▶ Auto' : '⏸ Auto'}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 sm:px-3 sm:text-sm"
            >
              New Playlist
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
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
          <aside
            className={`absolute inset-y-0 left-0 z-30 w-72 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950 sm:w-80 lg:relative lg:z-auto lg:translate-x-0 ${
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
              className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
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
                  onStreamEnded={handleStreamEnded}
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
                    {autoPlay && (
                      <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                        ▶ Auto-play next channel is enabled
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

      {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
