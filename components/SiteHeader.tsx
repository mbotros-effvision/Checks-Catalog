'use client';

// Global nav. Mounted in app/layout.tsx above every page, so it is the one
// place the theme toggle can live and still be reachable from all three views.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const TABS = [
  { href: '/', label: 'Checks Catalog' },
  { href: '/mamta', label: 'Mamta Checks' },
  { href: '/comparison', label: 'Comparison' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
}

export function SiteHeader() {
  const pathname = usePathname() || '/';
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">Spectera</span>
          <span className="brand-sub">Feasibility</span>
        </Link>
        <nav className="nav-tabs" aria-label="Views">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={'nav-tab' + (active ? ' is-active' : '')}
                aria-current={active ? 'page' : undefined}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="hdr-spacer" />
        <ThemeToggle />
      </div>
    </header>
  );
}
