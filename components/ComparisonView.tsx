'use client';

import { useMemo, useState } from 'react';
import type { ComparisonLink, ComparisonResult, LinkKind, MamtaVersion } from '@/types';
import { srcCls } from '@/lib/taxonomy';

export interface ComparisonViewProps {
  result: ComparisonResult;
}

const VERSION_CLASS: Record<MamtaVersion, string> = { US: 'is-us', 'Ex-US': 'is-exus', Both: 'is-both' };

/** Marks a check that appears on more than one row, so the repeat reads as
 *  intent. `n` is the total number of rows it appears on. */
function Repeat({ n, side }: { n: number; side: 'Mamta check' | 'Catalog check' }) {
  if (n < 2) return null;
  return (
    <span className="dup-mark" title={`This ${side.toLowerCase()} appears on ${n} rows — it is paired with ${n} checks on the other side.`}>
      ×{n}
    </span>
  );
}

function MamtaCell({ link }: { link: ComparisonLink }) {
  if (!link.mamta) return <span className="cell-none">—</span>;
  return (
    <>
      <div className="cmp-catalog-item">
        <span className="cell-id">{link.mamta.seq}</span>
        <span className={'ver-tag ' + VERSION_CLASS[link.mamta.version]}>{link.mamta.version}</span>
        <span className="cell-pillar">{link.mamta.category}</span>
        <Repeat n={link.mamtaRepeat} side="Mamta check" />
      </div>
      <span className="cn">{link.mamta.check}</span>
    </>
  );
}

function CatalogCell({ link }: { link: ComparisonLink }) {
  if (!link.catalog) {
    return link.unresolved.length > 0 ? (
      <span className="cell-none is-warn">unresolved: {link.unresolved.join(', ')}</span>
    ) : (
      <span className="cell-none">—</span>
    );
  }
  return (
    <>
      <div className="cmp-catalog-item">
        <span className="cell-id">{link.catalog.id}</span>
        <span className="cell-pillar">{link.catalog.pillar}</span>
        <span className={'src ' + srcCls(link.catalog.source)}>{link.catalog.source}</span>
        {link.catalog.custom && (
          <span className="custom-i" title="Custom check">
            ✎
          </span>
        )}
        <Repeat n={link.catalogRepeat} side="Catalog check" />
      </div>
      <span className="cn">{link.catalog.check}</span>
    </>
  );
}

function LinkTable({ links }: { links: ComparisonLink[] }) {
  if (links.length === 0) return <div className="no-results">Nothing in this bucket.</div>;
  return (
    <div className="tbl-scroll">
      <table className="cmp-table">
        <thead>
          <tr>
            <th style={{ width: '38%' }}>Mamta check</th>
            <th style={{ width: '38%' }}>Catalog check</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr className="data" key={l.key}>
              <td className={l.mamta ? '' : 'is-empty'}>
                <MamtaCell link={l} />
              </td>
              <td className={l.catalog ? '' : 'is-empty'}>
                <CatalogCell link={l} />
              </td>
              <td>
                <div className="pl">{l.note}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparisonView({ result }: ComparisonViewProps) {
  const [kind, setKind] = useState<LinkKind>('mamta-only');
  const { counts, links } = result;

  const shown = useMemo(() => links.filter((l) => l.kind === kind), [links, kind]);

  const tabs: { key: LinkKind; label: string; n: number }[] = [
    { key: 'mamta-only', label: 'Only in Mamta', n: counts.gaps },
    { key: 'near', label: 'Near match', n: counts.nearPairs },
    { key: 'match', label: 'Matched', n: counts.matchedPairs },
    { key: 'catalog-only', label: 'Only in catalog', n: counts.catalogOnly },
  ];

  return (
    <>
      {/* Every row pairs one Mamta check with one catalog check, so these four
          buckets partition the displayed rows exactly — they do sum. */}
      <div className="cmp-summary">
        <div className="cmp-stats">
          <div className="cmp-stat is-gap">
            <b className="n">{counts.gaps}</b>
            <span className="l">Only in Mamta</span>
          </div>
          <div className="cmp-stat is-near">
            <b className="n">{counts.nearPairs}</b>
            <span className="l">Near match</span>
          </div>
          <div className="cmp-stat">
            <b className="n">{counts.matchedPairs}</b>
            <span className="l">Matched</span>
          </div>
          <div className="cmp-stat">
            <b className="n">{counts.catalogOnly}</b>
            <span className="l">Only in catalog</span>
          </div>
          <div className="cmp-stat is-total">
            <b className="n">{links.length}</b>
            <span className="l">Rows</span>
          </div>
        </div>
        {counts.unmapped > 0 && (
          <div className="cmp-stat is-warn">
            <b className="n">{counts.unmapped}</b>
            <span className="l">Unmapped</span>
          </div>
        )}
      </div>

      <p className="cmp-bridge">
        One row per pair. A check that pairs with more than one check on the other side is repeated, marked{' '}
        <span className="dup-mark">×n</span> — so the {counts.matchedPairs} matched rows cover{' '}
        <b>{counts.matched}</b> of the <b>{counts.mamtaTotal}</b> Mamta checks and <b>{counts.catalogMatched}</b> of the{' '}
        <b>{counts.catalogTotal}</b> catalog checks.
      </p>

      <div className="cmp-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={'cmp-tab' + (kind === t.key ? ' is-active' : '')}
            type="button"
            onClick={() => setKind(t.key)}
          >
            {t.label} <span className="n">{t.n}</span>
          </button>
        ))}
      </div>

      <LinkTable links={shown} />
    </>
  );
}
