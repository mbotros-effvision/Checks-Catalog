'use client';

import { Fragment, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { CheckRow, ComparisonPair, ComparisonResult, MamtaRow, MamtaVersion } from '@/types';
import { mvpClass, mvpLabel, srcCls } from '@/lib/taxonomy';

export interface ComparisonViewProps {
  result: ComparisonResult;
}

type BucketKey = 'matched' | 'near' | 'gaps' | 'catalogOnly' | 'unmapped';

const VERSION_CLASS: Record<MamtaVersion, string> = { US: 'is-us', 'Ex-US': 'is-exus', Both: 'is-both' };

function MamtaSide({ row }: { row: MamtaRow }) {
  return (
    <div className="cmp-side">
      <div className="cmp-catalog-item">
        <span className="cell-id">{row.seq}</span>
        <span className={'ver-tag ' + VERSION_CLASS[row.version]}>{row.version}</span>
        <span className="cell-pillar">{row.category}</span>
      </div>
      <span className="cn">{row.check}</span>
    </div>
  );
}

function CatalogItem({ row }: { row: CheckRow }) {
  return (
    <div className="cmp-catalog-item">
      <span className="cell-id">{row.id}</span>
      <span className="cn">{row.check}</span>
      <span className="cell-pillar">{row.pillar}</span>
      {row.custom && (
        <span className="custom-i" title="Custom check">
          ✎
        </span>
      )}
    </div>
  );
}

function PairList({ pairs, relation }: { pairs: ComparisonPair[]; relation: 'match' | 'near' }) {
  if (pairs.length === 0) return <div className="no-results">Nothing in this bucket.</div>;
  return (
    <div className="tbl-scroll">
      {pairs.map((p) => (
        <div className="cmp-pair" key={p.mamta.id}>
          <MamtaSide row={p.mamta} />
          <ArrowRight className="cmp-arrow" size={13} aria-hidden />
          <div className="cmp-side">
            <span className={'rel rel-' + relation}>{relation === 'near' ? 'Near match' : 'Match'}</span>
            {p.catalog.map((c) => (
              <CatalogItem key={c.id} row={c} />
            ))}
            {p.note && <div className="cmp-note">{p.note}</div>}
            {p.unresolved.length > 0 && (
              <div className="cmp-note is-warn">
                Unresolved catalog reference{p.unresolved.length > 1 ? 's' : ''}: {p.unresolved.join(', ')} — the check
                was renamed or deleted, so the mapping needs updating.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GapTable({ result }: { result: ComparisonResult }) {
  if (result.gaps.length === 0) return <div className="no-results">No gaps — every Mamta check has a counterpart.</div>;
  return (
    <div className="tbl-scroll">
      <table>
        <thead>
          <tr>
            <th style={{ width: '44px' }}>#</th>
            <th style={{ width: '62px' }}>Version</th>
            <th style={{ width: '11%' }}>Category</th>
            <th style={{ width: '30%' }}>Mamta check</th>
            <th>Why it is a gap</th>
            <th style={{ width: '70px' }}>Priority</th>
          </tr>
        </thead>
        <tbody>
          {result.gaps.map((g) => (
            <tr className="data" key={g.mamta.id}>
              <td>
                <span className="cell-id">{g.mamta.seq}</span>
              </td>
              <td>
                <span className={'ver-tag ' + VERSION_CLASS[g.mamta.version]}>{g.mamta.version}</span>
              </td>
              <td>
                <span className="cell-pillar">{g.mamta.category}</span>
              </td>
              <td>
                <span className="cn">{g.mamta.check}</span>
              </td>
              <td>
                <div className="pl">{g.note}</div>
              </td>
              <td>
                <span className={'prio-ro prio-' + (g.mamta.priority === 'High' ? 'high' : 'med')}>
                  {g.mamta.priority}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CatalogOnlyTable({ rows }: { rows: CheckRow[] }) {
  let lastPillar = '';
  if (rows.length === 0) return <div className="no-results">Every catalog check is covered by the checklist.</div>;
  return (
    <div className="tbl-scroll">
      <table>
        <thead>
          <tr>
            <th style={{ width: '44px' }}>ID</th>
            <th style={{ width: '14%' }}>Pillar</th>
            <th style={{ width: '30%' }}>Check</th>
            <th>Plain English</th>
            <th style={{ width: '78px' }}>Source</th>
            <th style={{ width: '46px' }}>MVP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const showBand = r.pillar !== lastPillar;
            if (showBand) lastPillar = r.pillar;
            return (
              <Fragment key={r.id}>
                {showBand && (
                  <tr className="ph">
                    <td colSpan={6}>
                      <div className="ph-band" style={{ ['--lc' as string]: 'var(--accent)' }}>
                        <span className="pn">{r.pillar}</span>
                        <span className="ll">not covered by the checklist</span>
                      </div>
                    </td>
                  </tr>
                )}
                <tr className={'data' + (r.custom ? ' is-added' : '')}>
                  <td>
                    <span className="cell-id">{r.id}</span>
                  </td>
                  <td>
                    <span className="cell-pillar">{r.pillar}</span>
                  </td>
                  <td>
                    <span className="cn">{r.check}</span>
                    {r.custom && (
                      <span className="custom-i" title="Custom check">
                        ✎
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="pl">{r.plainEnglish}</div>
                  </td>
                  <td>
                    <span className={'src ' + srcCls(r.source)}>{r.source}</span>
                  </td>
                  <td>
                    <span className={'mvp-ro is-' + mvpClass(r.mvp)}>{mvpLabel(r.mvp)}</span>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UnmappedTable({ rows }: { rows: MamtaRow[] }) {
  return (
    <div className="tbl-scroll">
      <table>
        <thead>
          <tr>
            <th style={{ width: '44px' }}>#</th>
            <th style={{ width: '170px' }}>Mamta id</th>
            <th>Check</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr className="data" key={r.id}>
              <td>
                <span className="cell-id">{r.seq}</span>
              </td>
              <td>
                <span className="cell-id">{r.id}</span>
              </td>
              <td>
                <span className="cn">{r.check}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparisonView({ result }: ComparisonViewProps) {
  const [bucket, setBucket] = useState<BucketKey>('gaps');
  const { counts } = result;

  // The single most-asked question about this screen is why the two "Matched"
  // tiles differ, so state the bridge rather than leaving it to be inferred.
  const shared = useMemo(() => {
    const fan = new Map<number, number>();
    for (const p of result.matched) for (const c of p.catalog) fan.set(c.id, (fan.get(c.id) ?? 0) + 1);
    return [...fan.values()].filter((n) => n > 1).length;
  }, [result.matched]);

  const tabs = useMemo(() => {
    const t: { key: BucketKey; label: string; n: number }[] = [
      { key: 'gaps', label: 'Only in Mamta', n: counts.gaps },
      { key: 'near', label: 'Near match', n: counts.near },
      { key: 'matched', label: 'Matched', n: counts.matched },
      { key: 'catalogOnly', label: 'Only in catalog', n: counts.catalogOnly },
    ];
    // Surfaced only when the mapping has holes — a complete map hides this.
    if (counts.unmapped > 0) t.push({ key: 'unmapped', label: 'Unmapped', n: counts.unmapped });
    return t;
  }, [counts]);

  return (
    <>
      {/* Two independent partitions, deliberately shown as two groups: each
          side totals its own catalog, and adding across them would double-count
          the overlap (many Mamta rows resolve onto one catalog check). */}
      <div className="cmp-summary">
        <div className="cmp-group">
          <div className="cmp-group-h">
            Mamta checklist <span className="tot">{counts.mamtaTotal}</span>
          </div>
          <div className="cmp-stats">
            <div className="cmp-stat is-gap">
              <b className="n">{counts.gaps}</b>
              <span className="l">Only in Mamta</span>
            </div>
            <div className="cmp-stat is-near">
              <b className="n">{counts.near}</b>
              <span className="l">Near match</span>
            </div>
            <div className="cmp-stat">
              <b className="n">{counts.matched}</b>
              <span className="l">Matched</span>
            </div>
            {counts.unmapped > 0 && (
              <div className="cmp-stat is-warn">
                <b className="n">{counts.unmapped}</b>
                <span className="l">Unmapped</span>
              </div>
            )}
          </div>
        </div>

        <div className="cmp-group">
          <div className="cmp-group-h">
            Checks catalog <span className="tot">{counts.catalogTotal}</span>
          </div>
          <div className="cmp-stats">
            <div className="cmp-stat is-gap">
              <b className="n">{counts.catalogOnly}</b>
              <span className="l">Only in catalog</span>
            </div>
            <div className="cmp-stat is-near">
              <b className="n">{counts.catalogNear}</b>
              <span className="l">Near match</span>
            </div>
            <div className="cmp-stat">
              <b className="n">{counts.catalogMatched}</b>
              <span className="l">Matched</span>
            </div>
          </div>
        </div>
      </div>

      <p className="cmp-bridge">
        The two <b>Matched</b> tiles count the same overlap from opposite ends, so they differ:{' '}
        <b>{counts.matched}</b> Mamta checks are covered by <b>{counts.catalogMatched}</b> catalog checks, because{' '}
        <b>{shared}</b> catalog checks are shared by more than one Mamta check — usually the US and Ex-US versions of
        the same test.
      </p>

      <div className="cmp-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={'cmp-tab' + (bucket === t.key ? ' is-active' : '')}
            type="button"
            onClick={() => setBucket(t.key)}
          >
            {t.label} <span className="n">{t.n}</span>
          </button>
        ))}
      </div>

      {bucket === 'gaps' && <GapTable result={result} />}
      {bucket === 'near' && <PairList pairs={result.near} relation="near" />}
      {bucket === 'matched' && <PairList pairs={result.matched} relation="match" />}
      {bucket === 'catalogOnly' && <CatalogOnlyTable rows={result.catalogOnly} />}
      {bucket === 'unmapped' && <UnmappedTable rows={result.unmapped} />}
    </>
  );
}
