import type { Config } from 'tailwindcss';

// Dark mode is attribute-driven (data-theme="dark" on <html>), matching the
// original report. Design tokens live as CSS custom properties in globals.css;
// they are surfaced here so utilities and the ported component classes agree.
const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        'text-soft': 'var(--text-soft)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        track: 'var(--track)',
        thead: 'var(--thead)',
        'row-hover': 'var(--row-hover)',
      },
      fontFamily: {
        sans: 'var(--sans)',
        mono: 'var(--mono)',
      },
      borderRadius: {
        card: 'var(--radius)',
      },
      boxShadow: {
        card: 'var(--shadow)',
        'card-lg': 'var(--shadow-lg)',
      },
      maxWidth: {
        page: '1560px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
