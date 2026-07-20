'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { MamtaFilters, MamtaRow, MamtaVersion } from '@/types';
import { EMPTY_MAMTA_FILTERS, filteredMamta } from '@/lib/mamta-filters';

export interface MamtaTableProps {
  rows: MamtaRow[];
}

const VERSION_CLASS: Record<MamtaVersion, string> = { US: 'is-us', 'Ex-US': 'is-exus', Both: 'is-both' };

export function MamtaTable({ rows }: MamtaTableProps) {
  const [filters, setFilters] = useState<MamtaFilters>(EMPTY_MAMTA_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))], [rows]);
  const shown = useMemo(() => filteredMamta(rows, filters), [rows, filters]);

  function patch(p: Partial<MamtaFilters>) {
    setFilters((f) => ({ ...f, ...p }));
  }
  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
  }

  let lastBand = '';

  return (
    <>
      <div className="toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search checks, steps, expected results…"
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
          />
        </div>

        <div className="fgroup">
          <label>Version</label>
          <select value={filters.version} onChange={(e) => patch({ version: e.target.value })}>
            <option value="">All versions</option>
            <option value="US">US (+ shared)</option>
            <option value="Ex-US">Ex-US (+ shared)</option>
            <option value="Both">Shared only</option>
          </select>
        </div>

        <div className="fgroup">
          <label>Category</label>
          <select value={filters.category} onChange={(e) => patch({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="fgroup">
          <label>Priority</label>
          <select value={filters.priority} onChange={(e) => patch({ priority: e.target.value })}>
            <option value="">All</option>
            <option>High</option>
            <option>Medium</option>
          </select>
        </div>

        <button className="btn" type="button" onClick={() => setFilters(EMPTY_MAMTA_FILTERS)}>
          Clear
        </button>
        <span className="count-chip">
          <b>{shown.length}</b> of {rows.length}
        </span>
      </div>

      <div className="tbl-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ width: '44px' }}>#</th>
              <th style={{ width: '62px' }}>Version</th>
              <th style={{ width: '11%' }}>Category</th>
              <th style={{ width: '34%' }}>Check Item</th>
              <th style={{ width: '30%' }}>Expected Result</th>
              <th style={{ width: '70px' }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              // Rows arrive in workbook order, so a band per category+section
              // change groups them exactly as the source tabs do.
              const band = r.version + ' · ' + r.category + ' · ' + r.section;
              const showBand = band !== lastBand;
              if (showBand) lastBand = band;
              const open = openId === r.id;

              return (
                <Fragment key={r.id}>
                  {showBand && (
                    <tr className="ph">
                      <td colSpan={6}>
                        <div className="ph-band" style={{ ['--lc' as string]: 'var(--accent)' }}>
                          <span className="pn">{r.category}</span>
                          <span className="ll">{r.section}</span>
                          <span className={'ver-tag ' + VERSION_CLASS[r.version]}>{r.version}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className={'data expandable' + (open ? ' is-open' : '')} onClick={() => toggle(r.id)}>
                    <td>
                      <span className="cell-id">{r.seq}</span>
                    </td>
                    <td>
                      <span className={'ver-tag ' + VERSION_CLASS[r.version]}>{r.version}</span>
                    </td>
                    <td>
                      <span className="cell-pillar">{r.category}</span>
                    </td>
                    <td>
                      <button
                        className="cn-btn"
                        type="button"
                        aria-expanded={open}
                        title={open ? 'Hide detail' : 'Show steps and URL'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(r.id);
                        }}
                      >
                        <ChevronRight className="row-caret" size={13} aria-hidden />
                        <span className="cn">{r.check}</span>
                      </button>
                    </td>
                    <td>
                      <div className="pl">{r.expected}</div>
                    </td>
                    <td>
                      <span className={'prio-ro prio-' + (r.priority === 'High' ? 'high' : 'med')}>{r.priority}</span>
                    </td>
                  </tr>

                  {open && (
                    <tr className="ver-exp">
                      <td colSpan={6}>
                        <div className="ver-anim">
                          <div className="ver-anim-inner">
                            <div className="ver-panel">
                              {/* The # column is a running 1..174; this keeps the row
                                  traceable back to its own tab and row in the workbook. */}
                              <div className="mamta-origin">
                                #{r.seq} · workbook tab “{r.version === 'Both' ? r.category : r.version + ' ' + r.category}
                                ”, row {r.number}
                              </div>
                              <div className="ver-panel-h">Steps to test</div>
                              <div className="how steps-body">{r.steps}</div>
                              <div className="ver-panel-h" style={{ marginTop: '12px' }}>
                                Expected result
                              </div>
                              <div className="how">{r.expected}</div>
                              <div className="ver-panel-h" style={{ marginTop: '12px' }}>
                                Page / URL
                              </div>
                              <div className="url-link">{r.url}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <div className="no-results">No checks match these filters.</div>}
      </div>
    </>
  );
}
