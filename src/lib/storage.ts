const CONSENT_KEY = 'falconstream-consent';
const FAVORITES_KEY = 'falconstream-favorites';
const RECENT_KEY = 'falconstream-recent';
const VOLUME_KEY = 'falconstream-volume';
const THEME_KEY = 'falconstream-theme';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getConsent(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function setConsent(value: boolean): void {
  if (!isBrowser()) return;
  localStorage.setItem(CONSENT_KEY, String(value));
}

export function getFavorites(): string[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function setFavorites(ids: string[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function toggleFavorite(id: string): string[] {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(id);
  }
  setFavorites(favs);
  return favs;
}

export interface RecentChannel {
  id: string;
  name: string;
  timestamp: number;
}

export function getRecent(): RecentChannel[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecent(id: string, name: string): void {
  if (!isBrowser()) return;
  const recent = getRecent().filter((r) => r.id !== id);
  recent.unshift({ id, name, timestamp: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
}

export function getVolume(): number {
  if (!isBrowser()) return 1;
  const v = localStorage.getItem(VOLUME_KEY);
  return v !== null ? parseFloat(v) : 1;
}

export function setVolume(value: number): void {
  if (!isBrowser()) return;
  localStorage.setItem(VOLUME_KEY, String(value));
}

export function getTheme(): 'dark' | 'light' {
  if (!isBrowser()) return 'dark';
  return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
}

export function setTheme(theme: 'dark' | 'light'): void {
  if (!isBrowser()) return;
  localStorage.setItem(THEME_KEY, theme);
}
