'use client';

// Native render of the tools-coverage summary (previously an embedded iframe of
// public/tools/tools-coverage-summary.html). Same data, but styled with the app's
// own design tokens so it reads as one page with the rest of the site.
import { useState } from 'react';
import { TOOLS, FIT, CATALOG_TOTAL, type Tool } from '@/app/tools-analysis/toolsData';

function FitPill({ k }: { k: Tool['snurraFit'] }) {
  const f = FIT[k];
  return (
    <span className={`fitpill ${f.cls}`} title={f.desc}>
      <span className="fdot" />
      {f.lab}
    </span>
  );
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function ToolRow({ t }: { t: Tool }) {
  const [open, setOpen] = useState(false);
  const cov = t.cov.length;
  const nc = t.newcov.length;
  return (
    <div className={`tsum-row${open ? ' open' : ''}`}>
      <button className="tsum-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="tsum-name">
            {t.name} <FitPill k={t.snurraFit} />
          </div>
          <div className="tsum-ident">{t.ident}</div>
          {t.fitNote && (
            <div className="tsum-fn">
              <b>Fits into Snurra:</b> {t.fitNote}
            </div>
          )}
          <div className="tsum-cost">
            <b>Cost:</b> {t.costShort}
          </div>
        </div>
        <div className="tsum-nums">
          <div className="tsum-cnum">
            {cov}
            <small>catalog checks</small>
          </div>
          <span className="tsum-nbadge">+{nc} new</span>
        </div>
        <div className="tsum-caret" aria-hidden>
          ▸
        </div>
      </button>
      {open && (
        <div className="tsum-panel">
          <div className="tsum-block">
            <h4>
              Catalog checks covered <span className="c">{cov}</span>
            </h4>
            <div className="tsum-checks">
              {t.cov.map((c, i) => (
                <div className="tsum-ci" key={i}>
                  <CheckIcon />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tsum-block">
            <h4>
              Additional checks it can cover — not in the catalog <span className="c">{nc}</span>
            </h4>
            <div className="tsum-checks newc">
              {t.newcov.map((c, i) => (
                <div className="tsum-ci" key={i}>
                  <PlusIcon />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tsum-block">
            <h4>Cost</h4>
            <p className="tsum-costp">{t.cost}</p>
          </div>
          <div className="tsum-block">
            <h4>Integration</h4>
            <div className="tsum-kv">
              {Object.entries(t.integ).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <code className="k">{k}</code>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tsum-block">
            <h4>Limitations</h4>
            <ul className="tsum-lims">
              {t.lims.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
          <a className="tsum-open" href={`/tools/${t.file}`} target="_blank" rel="noopener">
            Open full analysis →
          </a>
        </div>
      )}
    </div>
  );
}

export function ToolsSummary() {
  const union = new Set<string>();
  let sum = 0;
  let newsum = 0;
  TOOLS.forEach((t) => {
    t.cov.forEach((c) => union.add(c));
    sum += t.cov.length;
    newsum += t.newcov.length;
  });
  const u = union.size;

  return (
    <div className="tsum">
      <div className="tsum-totals">
        <div className="tsum-tot">
          <div className="big">
            {u}
            <small> / {CATALOG_TOTAL}</small>
          </div>
          <div className="lab">distinct catalog checks coverable across all tools (union)</div>
          <div className="tsum-barout">
            <div className="tsum-barin" style={{ width: `${((u / CATALOG_TOTAL) * 100).toFixed(1)}%` }} />
          </div>
        </div>
        <div className="tsum-tot">
          <div className="big">{TOOLS.length}</div>
          <div className="lab">tools evaluated · {sum} tool→check mappings (with overlaps)</div>
        </div>
        <div className="tsum-tot">
          <div className="big">{newsum}</div>
          <div className="lab">net-new checks these tools cover that the catalog doesn’t have yet</div>
        </div>
      </div>

      <div className="tsum-secttl">The tools</div>
      <p className="tsum-lead">
        Sorted as listed. Click a row to expand. “Catalog checks” are held to a 100%-certain bar (verbatim from{' '}
        <code>feasibility-app/data/checks.ts</code>); “net-new” are deterministic checks the tool covers that have no
        catalog entry — candidate additions.
      </p>
      <div className="tsum-legend">
        <span className="lt">Fits into Snurra (API integration):</span>
        <span className="li">
          <FitPill k="api-native" /> URL/domain-in — drop-in adapter
        </span>
        <span className="li">
          <FitPill k="api-with-setup" /> API, but needs a provisioned target or your own test code
        </span>
        <span className="li">
          <FitPill k="no-api" /> run a binary, parse files
        </span>
      </div>

      <div className="tsum-rows">
        {TOOLS.map((t) => (
          <ToolRow key={t.file} t={t} />
        ))}
      </div>

      <div className="tsum-foot">
        Catalog check names are verbatim from <code>feasibility-app/data/checks.ts</code> (217 checks); counts, cost,
        integration and limitations are drawn from each tool’s own <code>&lt;tool&gt;-analysis.html</code>. Some pricing
        figures are third-party/approximate or gated — see the individual analysis page for sourcing.
      </div>
    </div>
  );
}
