import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pillar Feasibility — Per-check Appendix',
  description: 'Per-check feasibility appendix for Spectera website-audit pillars.',
};

// No-flash theme script (ported verbatim): applies data-theme before paint so
// the correct light/dark tokens are in place on first render.
const themeScript = `(function(){try{var t=localStorage.getItem('spectera_theme');if(!t)t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
