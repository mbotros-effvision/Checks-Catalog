'use client';

import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle light / dark" type="button">
      {theme === 'dark' ? '☀ Light' : '☾ Dark'}
    </button>
  );
}
