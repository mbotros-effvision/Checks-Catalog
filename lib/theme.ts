'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Reads the theme applied by the no-flash inline script in layout.tsx and
 * toggles it, persisting to the same `spectera_theme` key as the original.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as Theme) || 'light';
    setTheme(t);
  }, []);

  const toggle = () => {
    const t: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('spectera_theme', t);
    } catch {
      /* ignore */
    }
    setTheme(t);
  };

  return { theme, toggle };
}
