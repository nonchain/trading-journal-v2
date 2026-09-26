import { useCallback, useEffect, useState } from 'react';
import { journalRepo } from '@/lib/storage';
import type { ThemeMode } from '@/lib/schemas';

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

export function applyTheme(theme: ThemeMode) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    journalRepo.getSettings().then((s) => {
      if (!alive) return;
      setThemeState(s.theme);
      applyTheme(s.theme);
      setReady(true);
    });
    const unwatch = journalRepo.watchSettings((s) => {
      setThemeState(s.theme);
      applyTheme(s.theme);
    });
    return () => {
      alive = false;
      unwatch();
    };
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback(async (next: ThemeMode) => {
    setThemeState(next);
    applyTheme(next);
    await journalRepo.updateSettings({ theme: next });
  }, []);

  return { theme, setTheme, ready };
}
