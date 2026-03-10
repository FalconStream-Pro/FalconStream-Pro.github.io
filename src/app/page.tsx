'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseM3U, Channel } from '@/lib/m3uParser';
import { presetPlaylists, PresetPlaylist } from '@/lib/presetPlaylists';
import { cn, buildProxiedUrl } from '@/lib/utils';
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
  getProxyEnabled,
  setProxyEnabled as saveProxyEnabled,
  getProxyUrl,
  setProxyUrl as saveProxyUrl,
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sun, Moon, Keyboard, Menu, ListPlus, ChevronLeft, ChevronRight, Star,
  Search, X, Loader2, Play, Pause, Shield, ShieldCheck
} from 'lucide-react';
import ConsentModal from './components/ConsentModal';
import UploadZone from './components/UploadZone';
import VideoPlayer from './components/VideoPlayer';
import ChannelList from './components/ChannelList';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';
import ToastContainer, { showToast } from './components/Toast';
import HeroSection from './components/HeroSection';
import CategoryRow from './components/CategoryRow';
import ScrollToTop from './components/ScrollToTop';
import ProxySettings from './components/ProxySettings';

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
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [proxyEnabled, setProxyEnabledState] = useState(false);
  const [proxyUrl, setProxyUrlState] = useState('');
  const [showProxySettings, setShowProxySettings] = useState(false);

  // Track header opacity on scroll
  useEffect(() => {
    const handler = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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

  const featuredPresets = useMemo(
    () => presetPlaylists.filter((p) => p.region === 'Featured'),
    []
  );

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
    setProxyEnabledState(getProxyEnabled());
    setProxyUrlState(getProxyUrl());
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
    const wasFav = getFavorites().includes(id);
    const updated = toggleFavorite(id);
    setFavoritesState(updated);
    showToast(wasFav ? 'Removed from favorites' : 'Added to favorites', 'success');
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

  const handleProxySave = useCallback((enabled: boolean, url: string) => {
    setProxyEnabledState(enabled);
    setProxyUrlState(url);
    saveProxyEnabled(enabled);
    saveProxyUrl(url);
    showToast(enabled ? 'Proxy enabled' : 'Proxy disabled', 'success');
  }, []);

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
    showToast(`Loading ${preset.name}...`, 'info');
    try {
      const targetUrl = buildProxiedUrl(preset.url, proxyEnabled && proxyUrl ? proxyUrl : undefined);
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseM3U(text);
      if (parsed.length === 0) {
        setPresetError('No channels found in this playlist. It may be temporarily unavailable.');
        showToast('No channels found in this playlist', 'error');
        return;
      }
      setChannels(parsed);
      setActiveChannel(parsed[0]);
      addRecent(parsed[0].id, parsed[0].name);
      setRecentIds(getRecent().map((r) => r.id));
      showToast(`Loaded ${parsed.length} channels from ${preset.name}`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPresetError(`Failed to load playlist: ${message}. Please try again or check your connection.`);
      showToast('Failed to load playlist', 'error');
    } finally {
      setLoadingPreset(null);
    }
  }, [proxyEnabled, proxyUrl]);

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
        setThemeState((prev) => {
          const next = prev === 'dark' ? 'light' : 'dark';
          saveTheme(next);
          document.documentElement.classList.toggle('dark', next === 'dark');
          return next;
        });
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
  }, [channels, activeChannel, handleChannelSelect]);

  if (!mounted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <img
          src={LOGO_URL}
          alt="FalconStream Pro - Loading"
          className="mb-4 h-16 w-16 rounded-xl object-contain animate-pulse"
        />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    const isSearching = presetSearch.trim() !== '' || presetRegionFilter !== '';

    return (
      <div className={theme}>
        <div className="flex min-h-screen flex-col bg-background">
          {/* Sticky Header with scroll effect */}
          <header className={cn(
            "sticky top-0 z-10 flex w-full items-center justify-between border-b px-4 py-3 transition-all",
            headerScrolled
              ? 'border-border bg-background/95 shadow-sm backdrop-blur-md'
              : 'border-transparent bg-background/80 backdrop-blur-md'
          )}>
            <h1 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
              <img src={LOGO_URL} alt="FalconStream Pro" className="h-8 w-8 rounded-lg object-contain" />
              <span className="hidden sm:inline">FalconStream Pro</span>
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={() => setShowProxySettings(true)}
                variant={proxyEnabled ? 'default' : 'ghost'}
                size="icon"
                aria-label="Proxy settings"
                title={proxyEnabled ? 'Proxy enabled – click to configure' : 'Configure CORS proxy'}
                className={proxyEnabled ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30 hover:text-green-400' : ''}
              >
                {proxyEnabled ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setShowShortcuts(true)}
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleThemeToggle}
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <div className="w-full max-w-6xl mx-auto px-4 py-6 animate-fade-in">
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Browse {presetPlaylists.length} preset channel collections from around the world, or upload your own M3U playlist
              </p>
            </div>

            {/* Hero Banner */}
            <HeroSection
              featured={featuredPresets}
              onSelect={handlePresetSelect}
              loading={loadingPreset !== null}
            />

            {/* Region filter + Search */}
            <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search countries & categories..."
                  className="pl-10 pr-9"
                />
                {presetSearch && (
                  <button
                    onClick={() => setPresetSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setPresetRegionFilter('')}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    presetRegionFilter === ''
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  All
                </button>
                {Array.from(presetRegions.keys()).map((region) => (
                  <button
                    key={region}
                    onClick={() => setPresetRegionFilter(region === presetRegionFilter ? '' : region)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      presetRegionFilter === region
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {presetError && (
              <p className="mb-4 text-center text-sm text-red-500">{presetError}</p>
            )}

            {/* Netflix-style horizontal rows by region OR flat grid when searching */}
            {isSearching ? (
              <div className="mb-8">
                {filteredPresets.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Search className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No playlists match your search.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        disabled={loadingPreset !== null}
                        aria-label={`Load ${preset.name}`}
                        aria-busy={loadingPreset === preset.id}
                        className={cn(
                          "group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all sm:p-4",
                          "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
                          "disabled:opacity-50 disabled:hover:translate-y-0"
                        )}
                      >
                        <span className="text-2xl transition-transform group-hover:scale-110 sm:text-3xl">{preset.icon}</span>
                        <div className="min-w-0 w-full">
                          <p className="truncate text-sm font-semibold text-card-foreground">
                            {preset.name}
                          </p>
                          {preset.region && (
                            <p className="truncate text-xs text-muted-foreground">
                              {preset.region}
                            </p>
                          )}
                        </div>
                        {loadingPreset === preset.id && (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-8">
                {Array.from(presetRegions.entries()).map(([region, regionPresets]) => (
                  <CategoryRow
                    key={region}
                    title={region}
                    presets={regionPresets}
                    onSelect={handlePresetSelect}
                    loadingId={loadingPreset}
                  />
                ))}
              </div>
            )}

            <div className="mb-6 flex w-full items-center gap-3">
              <Separator className="flex-1" />
              <span className="whitespace-nowrap text-xs text-muted-foreground">or upload your own</span>
              <Separator className="flex-1" />
            </div>

            <UploadZone onFileLoaded={handleFileLoaded} onUrlLoaded={handleFileLoaded} proxyUrl={proxyEnabled ? proxyUrl : undefined} />
          </div>

          {/* Enhanced Footer */}
          <footer className="mt-auto w-full border-t border-border px-4 py-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <img src={LOGO_URL} alt="" className="h-5 w-5 rounded object-contain opacity-50" />
                <span className="font-medium text-foreground/70">FalconStream Pro</span>
              </div>
              <p>{presetPlaylists.length} preset collections • Open source M3U/HLS player • Dark mode • Favorites • Picture-in-Picture</p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                <span>Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">?</kbd> for shortcuts</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Built with Next.js &amp; HLS.js</span>
              </div>
            </div>
          </footer>
        </div>

        <ToastContainer />
        <ScrollToTop />
        {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}
        <ProxySettings
          open={showProxySettings}
          onClose={() => setShowProxySettings(false)}
          proxyEnabled={proxyEnabled}
          proxyUrl={proxyUrl}
          onSave={handleProxySave}
        />
      </div>
    );
  }

  // Player state - channels loaded
  return (
    <div className={theme}>
      <div className="flex h-screen flex-col bg-background">
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle channel list"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
              <img src={LOGO_URL} alt="FalconStream Pro" className="h-7 w-7 rounded object-contain" />
              <span className="hidden sm:inline">FalconStream Pro</span>
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {channels.length} channels
            </Badge>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Auto-play toggle */}
            <Button
              onClick={handleAutoPlayToggle}
              variant={autoPlay ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "text-xs sm:text-sm",
                autoPlay && "bg-primary/20 text-primary hover:bg-primary/30"
              )}
              title={autoPlay ? 'Auto-play is ON' : 'Auto-play is OFF'}
              aria-label="Toggle auto-play next channel"
            >
              {autoPlay ? <Play className="mr-1 h-3 w-3" /> : <Pause className="mr-1 h-3 w-3" />}
              <span className="hidden sm:inline">Auto</span>
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <ListPlus className="mr-1 h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Playlist</span>
            </Button>
            <Button
              onClick={() => setShowProxySettings(true)}
              variant={proxyEnabled ? 'default' : 'ghost'}
              size="icon"
              aria-label="Proxy settings"
              title={proxyEnabled ? 'Proxy enabled – click to configure' : 'Configure CORS proxy'}
              className={proxyEnabled ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30 hover:text-green-400' : ''}
            >
              {proxyEnabled ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => setShowShortcuts(true)}
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleThemeToggle}
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          {/* Sidebar - Channel List */}
          <aside
            className={cn(
              "absolute inset-y-0 left-0 z-30 w-72 transform border-r border-border bg-background transition-transform duration-300 ease-in-out sm:w-80 lg:relative lg:z-auto lg:translate-x-0",
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
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
              <div className="w-full max-w-4xl animate-fade-in">
                <VideoPlayer
                  url={activeChannel.url}
                  channelName={activeChannel.name}
                  onStreamEnded={handleStreamEnded}
                  proxyUrl={proxyEnabled && proxyUrl ? proxyUrl : undefined}
                />
                <div className="mt-4 flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
                      {activeChannel.name}
                    </h2>
                    {activeChannel.group && activeChannel.group !== 'Uncategorized' && (
                      <Badge variant="secondary" className="mt-1">
                        {activeChannel.group}
                      </Badge>
                    )}
                    {autoPlay && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                        <Play className="h-3 w-3" />
                        Auto-play next channel is enabled
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                    {/* Previous channel button */}
                    {(() => {
                      const idx = channels.findIndex((ch) => ch.id === activeChannel.id);
                      return (
                        <>
                          <Button
                            onClick={() => {
                              if (idx > 0) handleChannelSelect(channels[idx - 1]);
                            }}
                            disabled={idx <= 0}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label="Previous channel"
                            title="Previous channel (↑)"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          {/* Next channel button */}
                          <Button
                            onClick={() => {
                              if (idx < channels.length - 1) handleChannelSelect(channels[idx + 1]);
                            }}
                            disabled={idx >= channels.length - 1}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label="Next channel"
                            title="Next channel (↓)"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      );
                    })()}
                    {/* Favorite button */}
                    <Button
                      onClick={() => handleToggleFavorite(activeChannel.id)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label={
                        favorites.includes(activeChannel.id)
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                    >
                      {favorites.includes(activeChannel.id) ? (
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <Play className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  Select a channel to start watching
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      <ToastContainer />
      {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}
      <ProxySettings
        open={showProxySettings}
        onClose={() => setShowProxySettings(false)}
        proxyEnabled={proxyEnabled}
        proxyUrl={proxyUrl}
        onSave={handleProxySave}
      />
    </div>
  );
}
