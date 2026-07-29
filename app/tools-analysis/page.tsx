import { ToolsSummaryFrame } from '@/components/ToolsSummaryFrame';

export const metadata = { title: 'Tools Analysis — Pillar Feasibility' };

// Each analysis is a self-contained static HTML file served from public/tools/.
// The summary is embedded via an iframe; these give direct new-tab access too.
const ANALYSES = [
  { file: 'sitebulb-analysis.html', name: 'Sitebulb', meta: '35 catalog · +6 net-new' },
  { file: 'screaming-frog-analysis.html', name: 'Screaming Frog SEO Spider', meta: '48 catalog · +5 net-new' },
  { file: 'observepoint-analysis.html', name: 'ObservePoint', meta: '39 catalog · +6 net-new' },
  { file: 'semrush-analysis.html', name: 'SEMrush', meta: '30 catalog · +6 net-new' },
  { file: 'browserstack-automate-analysis.html', name: 'BrowserStack Automate', meta: '29 catalog · +5 net-new' },
  { file: 'percy-analysis.html', name: 'Percy', meta: '9 catalog · +4 net-new' },
  { file: 'immuniweb-analysis.html', name: 'ImmuniWeb', meta: '6 catalog · +10 net-new' },
  { file: 'cookiebot-analysis.html', name: 'Cookiebot (Usercentrics)', meta: '2 catalog · +7 net-new' },
  { file: 'wp-umbrella-analysis.html', name: 'WP Umbrella', meta: '6 catalog · +8 net-new' },
];

export default function ToolsAnalysisPage() {
  return (
    <div className="page">
      <div className="view-head">
        <h1 className="view-title">Tools Analysis</h1>
        <p className="view-sub">
          Capability &amp; embedding analysis of eight vendor tools evaluated for the Snurra Site Audit — the
          comparison summary is embedded below, with a full analysis page for each tool.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {ANALYSES.map((a) => (
          <a
            key={a.file}
            href={`/tools/${a.file}`}
            target="_blank"
            rel="noopener"
            style={{
              display: 'block',
              padding: '11px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              textDecoration: 'none',
              color: 'var(--ink)',
              transition: 'border-color .15s',
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>{a.name}</span>
              <span style={{ color: 'var(--accent)' }} aria-hidden>↗</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{a.meta}</div>
          </a>
        ))}
      </div>

      <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--muted)' }}>
        <a href="/tools/tools-coverage-summary.html" target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Open full summary ↗
        </a>
        <span> — or explore it inline:</span>
      </div>

      <ToolsSummaryFrame />
    </div>
  );
}
