import type { Channel } from './m3uParser';

const CONSENT_KEY = 'falconstream-consent';
const FAVORITES_KEY = 'falconstream-favorites-v2';
const RECENT_KEY = 'falconstream-recent-v2';
const VOLUME_KEY = 'falconstream-volume';
const MUTED_KEY = 'falconstream-muted';
const THEME_KEY = 'falconstream-theme';
const AUTOPLAY_KEY = 'falconstream-autoplay';
const PROXY_ENABLED_KEY = 'falconstream-proxy-enabled';
const PROXY_URL_KEY = 'falconstream-proxy-url';

/** A channel remembered outside of its playlist (favorites, history). */
export interface SavedChannel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  /** Preset id the channel came from, if any, so it can be reopened in context */
  playlistId?: string;
  playlistName?: string;
  timestamp: number;
}

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    // Earlier versions stored some values (theme, proxy URL) as bare strings
    return typeof fallback === 'string' && raw !== null ? (raw as T) : fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): settings just won't persist
  }
}

export function toSaved(
  channel: Channel,
  playlist?: { id?: string; name?: string },
): SavedChannel {
  return {
    id: channel.id,
    name: channel.name,
    url: channel.url,
    logo: channel.logo,
    group: channel.group,
    playlistId: playlist?.id,
    playlistName: playlist?.name,
    timestamp: Date.now(),
  };
}

export function savedToChannel(s: SavedChannel): Channel {
  return { id: s.id, name: s.name, url: s.url, logo: s.logo, group: s.group, tvgId: '', tvgName: '' };
}

export const getConsent = () => read<boolean>(CONSENT_KEY, false) === true;
export const setConsent = (value: boolean) => write(CONSENT_KEY, value);

export const getFavorites = () => read<SavedChannel[]>(FAVORITES_KEY, []);
export function toggleFavorite(channel: SavedChannel): SavedChannel[] {
  const favs = getFavorites();
  const next = favs.some((f) => f.id === channel.id)
    ? favs.filter((f) => f.id !== channel.id)
    : [channel, ...favs];
  write(FAVORITES_KEY, next);
  return next;
}

export const getRecent = () => read<SavedChannel[]>(RECENT_KEY, []);
export function addRecent(channel: SavedChannel): SavedChannel[] {
  const next = [channel, ...getRecent().filter((r) => r.id !== channel.id)].slice(0, 24);
  write(RECENT_KEY, next);
  return next;
}
export function clearRecent(): SavedChannel[] {
  write(RECENT_KEY, []);
  return [];
}

export const getVolume = () => {
  const v = read<number>(VOLUME_KEY, 1);
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : 1;
};
export const setVolume = (value: number) => write(VOLUME_KEY, value);
export const getMuted = () => read<boolean>(MUTED_KEY, false) === true;
export const setMuted = (value: boolean) => write(MUTED_KEY, value);

export type ThemePreference = 'dark' | 'light' | 'system';
export const getTheme = (): ThemePreference => {
  const t = read<string>(THEME_KEY, 'system');
  return t === 'dark' || t === 'light' ? t : 'system';
};
export const setTheme = (theme: ThemePreference) => write(THEME_KEY, theme);

export const getAutoPlay = () => read<boolean>(AUTOPLAY_KEY, false) === true;
export const setAutoPlay = (value: boolean) => write(AUTOPLAY_KEY, value);

export const getProxyEnabled = () => read<boolean>(PROXY_ENABLED_KEY, false) === true;
export const setProxyEnabled = (value: boolean) => write(PROXY_ENABLED_KEY, value);
export const getProxyUrl = () => {
  const v = read<string>(PROXY_URL_KEY, '');
  return typeof v === 'string' ? v : '';
};
export const setProxyUrl = (url: string) => write(PROXY_URL_KEY, url);
