'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History, Star, Github } from 'lucide-react';
import { parseM3U, Channel } from '@/lib/m3uParser';
import { getPreset, presetPlaylists, SPOTLIGHT_ID, type PresetPlaylist } from '@/lib/presetPlaylists';
import { buildProxiedUrl } from '@/lib/utils';
import {
  getConsent, setConsent, getFavorites, toggleFavorite, getRecent, addRecent, clearRecent,
  getAutoPlay, setAutoPlay as saveAutoPlay, getProxyEnabled, setProxyEnabled as saveProxyEnabled,
  getProxyUrl, setProxyUrl as saveProxyUrl, toSaved, savedToChannel, type SavedChannel,
} from '@/lib/storage';
import { useTheme } from '@/hooks/useTheme';
import AppHeader, { LOGO_URL } from './components/AppHeader';
import ConsentModal from './components/ConsentModal';
import ToastContainer, { showToast } from './components/Toast';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';
import ProxySettings from './components/ProxySettings';
import CommandPalette from './components/CommandPalette';
import Spotlight from './components/home/Spotlight';
import SavedRow from './components/home/SavedRow';
import PlaylistBrowser from './components/home/PlaylistBrowser';
import AddPlaylist from './components/home/AddPlaylist';
import WatchView from './components/watch/WatchView';

interface OpenPlaylist {
  /** Preset id; undefined for uploaded / linked / saved collections */
  id?: string;
  name: string;
  channels: Channel[];
}

const SITE_TITLE = 'FalconStream Pro - M3U Stream Player';

function parseHash(): { presetId: string; channelId?: string } | null {
  const m = window.location.hash.match(/^#watch\/([\w-]+)(?:\/([\w-]+))?/);
  return m ? { presetId: m[1], channelId: m[2] } : null;
}

export default function Home() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [consented, setConsented] = useState<boolean | null>(null);
  const [playlist, setPlaylist] = useState<OpenPlaylist | null>(null);
  const [active, setActive] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<SavedChannel[]>([]);
  const [recent, setRecent] = useState<SavedChannel[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [showProxy, setShowProxy] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const playlistRef = useRef<OpenPlaylist | null>(null);
  playlistRef.current = playlist;

  const effectiveProxy = proxyEnabled && proxyUrl ? proxyUrl : undefined;
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const recentIds = useMemo(() => recent.map((r) => r.id), [recent]);
  const spotlight = getPreset(SPOTLIGHT_ID)!;

  // Restore saved state after hydration
  useEffect(() => {
    setConsented(getConsent());
    setFavorites(getFavorites());
    setRecent(getRecent());
    setAutoPlay(getAutoPlay());
    setProxyEnabled(getProxyEnabled());
    setProxyUrl(getProxyUrl());
  }, []);

  const writeHash = useCallback((hash: string, push: boolean) => {
    const url = hash ? `#${hash}` : window.location.pathname + window.location.search;
    if (push) window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }, []);

  const selectChannel = useCallback((channel: Channel, list: OpenPlaylist | null = playlistRef.current) => {
    setActive(channel);
    setRecent(addRecent(toSaved(channel, list ? { id: list.id, name: list.name } : undefined)));
    if (list?.id) writeHash(`watch/${list.id}/${channel.id}`, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [writeHash]);

  const openPlaylist = useCallback((list: OpenPlaylist, channelId?: string, push = true) => {
    if (list.channels.length === 0) return;
    const first = (channelId && list.channels.find((c) => c.id === channelId)) || list.channels[0];
    setPlaylist(list);
    writeHash(list.id ? `watch/${list.id}/${first.id}` : 'watch', push);
    selectChannel(first, list);
  }, [selectChannel, writeHash]);

  const loadPreset = useCallback(async (preset: PresetPlaylist, channelId?: string, push = true) => {
    setLoadingId(preset.id);
    try {
      // Playlists hosted on this site are same-origin and never need the proxy
      const target = preset.url.startsWith('/') ? preset.url : buildProxiedUrl(preset.url, effectiveProxy);
      const res = await fetch(target);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const channels = parseM3U(await res.text());
      if (channels.length === 0) {
        showToast(`${preset.name} has no channels right now`, 'error');
        return;
      }
      openPlaylist({ id: preset.id, name: preset.name, channels }, channelId, push);
    } catch {
      showToast(`Couldn't load ${preset.name}. Check your connection and try again.`, 'error');
    } finally {
      setLoadingId(null);
    }
  }, [effectiveProxy, openPlaylist]);

  const goHome = useCallback(() => {
    setPlaylist(null);
    setActive(null);
    if (window.location.hash) writeHash('', false);
    window.scrollTo({ top: 0 });
  }, [writeHash]);

  // Deep links (#watch/<preset>/<channel>) and the browser back button
  useEffect(() => {
    const sync = () => {
      const target = parseHash();
      if (!target) {
        if (playlistRef.current) {
          setPlaylist(null);
          setActive(null);
        }
        return;
      }
      const current = playlistRef.current;
      if (current?.id === target.presetId) {
        const ch = current.channels.find((c) => c.id === target.channelId);
        if (ch) setActive(ch);
        return;
      }
      const preset = getPreset(target.presetId);
      if (preset) loadPreset(preset, target.channelId, false);
      else writeHash('', false);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
    // Run once on mount; loadPreset identity changes with the proxy setting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSaved = useCallback((item: SavedChannel, collection: SavedChannel[], collectionName: string) => {
    const preset = item.playlistId ? getPreset(item.playlistId) : undefined;
    if (preset) {
      loadPreset(preset, item.id);
      return;
    }
    openPlaylist({ name: collectionName, channels: collection.map(savedToChannel) }, item.id);
  }, [loadPreset, openPlaylist]);

  const handleToggleFavorite = useCallback((channel: Channel) => {
    const wasFav = favoriteIds.has(channel.id);
    const list = playlistRef.current;
    setFavorites(toggleFavorite(toSaved(channel, list ? { id: list.id, name: list.name } : undefined)));
    showToast(wasFav ? `Removed ${channel.name} from favorites` : `Added ${channel.name} to favorites`, 'success');
  }, [favoriteIds]);

  // Window title follows what's playing
  useEffect(() => {
    document.title = active ? `${active.name} · FalconStream Pro` : SITE_TITLE;
  }, [active]);

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch((s) => !s);
        return;
      }
      const t = e.target as HTMLElement;
      if (t?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key.toLowerCase() === 't') {
        toggleTheme();
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && playlist && active) {
        const idx = playlist.channels.findIndex((c) => c.id === active.id);
        const next = playlist.channels[idx + (e.key === 'ArrowDown' ? 1 : -1)];
        if (next) {
          e.preventDefault();
          selectChannel(next);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playlist, active, selectChannel, toggleTheme]);

  const watching = playlist && active;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="app-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]" />

      <AppHeader
        isDark={isDark}
        proxyEnabled={proxyEnabled}
        watching={!!watching}
        onHome={goHome}
        onSearch={() => setShowSearch(true)}
        onProxy={() => setShowProxy(true)}
        onShortcuts={() => setShowShortcuts(true)}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {watching ? (
          <WatchView
            playlistName={playlist.name}
            shareable={!!playlist.id}
            channels={playlist.channels}
            active={active}
            favoriteIds={favoriteIds}
            recentIds={recentIds}
            autoPlay={autoPlay}
            proxyUrl={effectiveProxy}
            onSelect={(c) => selectChannel(c)}
            onToggleFavorite={handleToggleFavorite}
            onToggleAutoPlay={() => {
              saveAutoPlay(!autoPlay);
              setAutoPlay(!autoPlay);
            }}
            onBack={goHome}
          />
        ) : (
          <div className="mx-auto max-w-7xl space-y-12 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
            <Spotlight
              preset={spotlight}
              loading={loadingId === spotlight.id}
              disabled={loadingId !== null}
              onWatch={(p, channelId) => loadPreset(p, channelId)}
            />

            <SavedRow
              title="Continue watching"
              icon={<History className="h-4 w-4 text-primary" />}
              items={recent}
              onOpen={(item) => openSaved(item, recent, 'Recently watched')}
              onClear={() => setRecent(clearRecent())}
            />
            <SavedRow
              title="Your favorites"
              icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
              items={favorites}
              onOpen={(item) => openSaved(item, favorites, 'Your favorites')}
            />

            <PlaylistBrowser loadingId={loadingId} onSelect={(p) => loadPreset(p)} />

            <AddPlaylist
              proxyUrl={effectiveProxy}
              onLoaded={(text, source) => {
                const channels = parseM3U(text);
                if (channels.length === 0) {
                  showToast('No channels found in that playlist', 'error');
                  return;
                }
                showToast(`Loaded ${channels.length} channels`, 'success');
                openPlaylist({ name: source.name, channels });
              }}
            />
          </div>
        )}
      </main>

      {!watching && (
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="" className="h-8 w-8 rounded-lg object-contain" />
              <div>
                <p className="font-medium text-foreground">FalconStream Pro</p>
                <p className="text-xs">A free M3U / HLS player. We don&apos;t host any streams.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
              <span>{presetPlaylists.length} playlists</span>
              <button type="button" onClick={() => setShowShortcuts(true)} className="hover:text-foreground">
                Keyboard shortcuts <kbd className="ml-1 rounded border border-border px-1">?</kbd>
              </button>
              <a
                href="https://github.com/FalconStream-Pro/FalconStream-Pro.github.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" /> Source
              </a>
            </div>
          </div>
        </footer>
      )}

      {consented === false && (
        <ConsentModal
          onAccept={() => {
            setConsent(true);
            setConsented(true);
          }}
        />
      )}

      <CommandPalette
        open={showSearch}
        onOpenChange={setShowSearch}
        channels={playlist?.channels ?? []}
        favorites={favorites}
        recent={recent}
        onChannel={(c) => selectChannel(c)}
        onSaved={(s) => openSaved(s, favoriteIds.has(s.id) ? favorites : recent, favoriteIds.has(s.id) ? 'Your favorites' : 'Recently watched')}
        onPlaylist={(p) => loadPreset(p)}
      />
      <KeyboardShortcutsPanel open={showShortcuts} onOpenChange={setShowShortcuts} />
      <ProxySettings
        open={showProxy}
        onClose={() => setShowProxy(false)}
        proxyEnabled={proxyEnabled}
        proxyUrl={proxyUrl}
        onSave={(enabled, url) => {
          setProxyEnabled(enabled);
          setProxyUrl(url);
          saveProxyEnabled(enabled);
          saveProxyUrl(url);
          showToast(enabled ? 'Proxy turned on' : 'Proxy turned off', 'success');
        }}
      />
      <ToastContainer />
    </div>
  );
}
