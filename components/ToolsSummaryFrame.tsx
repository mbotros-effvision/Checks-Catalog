'use client';

// Embeds the tools-coverage summary seamlessly inside the Tools Analysis tab:
// - hides the summary's own header (?embed=1) so there's no duplicate brand/toggle
// - auto-sizes to the summary's content height (no nested scrollbar — one page)
// - keeps the summary's theme in sync with the app's light/dark mode
//
// The parent drives sync: it posts the theme and a height request (with retries, so
// it survives React StrictMode's double-mount); the summary answers with its height.
import { useEffect, useRef, useState } from 'react';

export function ToolsSummaryFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1400);

  useEffect(() => {
    const sync = () => {
      const win = ref.current?.contentWindow;
      if (!win) return;
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      win.postMessage({ type: 'theme', theme }, '*');
      win.postMessage({ type: 'request-height' }, '*');
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'toolsummary-height' && typeof e.data.height === 'number') {
        setHeight(Math.max(400, Math.ceil(e.data.height)));
      }
    };
    window.addEventListener('message', onMessage);

    const iframe = ref.current;
    iframe?.addEventListener('load', sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Retry sync a few times to beat the iframe-load / mount race.
    const timers = [0, 200, 600, 1200, 2000].map((ms) => setTimeout(sync, ms));

    return () => {
      window.removeEventListener('message', onMessage);
      obs.disconnect();
      iframe?.removeEventListener('load', sync);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <iframe
      ref={ref}
      src="/tools/tools-coverage-summary.html?embed=1"
      title="Tools coverage summary"
      scrolling="no"
      style={{ width: '100%', height, border: 'none', background: 'transparent', display: 'block' }}
    />
  );
}
