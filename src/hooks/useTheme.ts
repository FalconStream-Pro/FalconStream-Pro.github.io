'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTheme, setTheme, type ThemePreference } from '@/lib/storage';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(pref: ThemePreference) {
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

/** Theme preference (dark / light / follow the system) applied to <html>. */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const pref = getTheme();
    setPreference(pref);
    setIsDark(apply(pref));
  }, []);

  // Follow live system changes while on "system"
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setIsDark(apply('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  const choose = useCallback((pref: ThemePreference) => {
    setPreference(pref);
    setTheme(pref);
    setIsDark(apply(pref));
  }, []);

  /** Flip between light and dark (leaves "system") */
  const toggle = useCallback(() => {
    choose(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  }, [choose]);

  return { preference, isDark, choose, toggle };
}
