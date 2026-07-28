'use client';

// Renders the embedded tools-coverage summary and keeps its theme in sync with
// the host app, so the iframe never clashes with the app's light/dark mode.
import { useEffect, useRef } from 'react';

export function ToolsSummaryFrame() {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const post = () => {
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      ref.current?.contentWindow?.postMessage({ type: 'theme', theme }, '*');
    };
    const iframe = ref.current;
    iframe?.addEventListener('load', post);
    const obs = new MutationObserver(post);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    post();
    return () => {
      obs.disconnect();
      iframe?.removeEventListener('load', post);
    };
  }, []);

  return (
    <iframe
      ref={ref}
      src="/tools/tools-coverage-summary.html"
      title="Tools coverage summary"
      style={{
        width: '100%',
        height: 'calc(100vh - 260px)',
        minHeight: 520,
        border: '1px solid var(--line)',
        borderRadius: 12,
        background: 'var(--surface)',
      }}
    />
  );
}
