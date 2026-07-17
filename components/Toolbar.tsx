'use client';

import type { Filters } from '@/types';
import { BUCKET_ORDER, BUCKETS } from '@/lib/taxonomy';
import { ThemeToggle } from './ThemeToggle';

export interface ToolbarProps {
  filters: Filters;
  pillars: string[];
  shownCount: number;
  totalCount: number;
  customCount: number;
  onFilterChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onAddCheck: () => void;
}

export function Toolbar({
  filters,
  pillars,
  shownCount,
  totalCount,
  customCount,
  onFilterChange,
  onClear,
  onAddCheck,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search checks, descriptions, methods…"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>

      <div className="fgroup">
        <label>Pillar</label>
        <select value={filters.pillar} onChange={(e) => onFilterChange({ pillar: e.target.value })}>
          <option value="">All pillars</option>
          {pillars.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="fgroup">
        <label>Source</label>
        <select value={filters.source} onChange={(e) => onFilterChange({ source: e.target.value })}>
          <option value="">All</option>
          <option>Snurra QA</option>
          <option>Presales</option>
          <option>Spectera</option>
        </select>
      </div>

      <div className="fgroup">
        <label>Feasibility</label>
        <select value={filters.bucket} onChange={(e) => onFilterChange({ bucket: e.target.value })}>
          <option value="">All buckets</option>
          {BUCKET_ORDER.map((k) => (
            <option key={k} value={k}>
              {BUCKETS[k].icon} {BUCKETS[k].label}
            </option>
          ))}
        </select>
      </div>

      <div className="fgroup">
        <label>MVP</label>
        <select value={filters.mvp} onChange={(e) => onFilterChange({ mvp: e.target.value })}>
          <option value="">All</option>
          <option>MVP</option>
          <option>Post-MVP</option>
          <option>Duplicated</option>
        </select>
      </div>

      <div className="fgroup">
        <label>Effort</label>
        <select value={filters.effort} onChange={(e) => onFilterChange({ effort: e.target.value })}>
          <option value="">All</option>
          <option>Live</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option value="N/A">N/A</option>
        </select>
      </div>

      <div className="fgroup">
        <label>Phase</label>
        <select value={filters.phase} onChange={(e) => onFilterChange({ phase: e.target.value })}>
          <option value="">All</option>
          <option value="A">A · URL-only</option>
          <option value="B">B · needs access</option>
        </select>
      </div>

      <div className="fgroup">
        <label>Hero</label>
        <select value={filters.hero} onChange={(e) => onFilterChange({ hero: e.target.value })}>
          <option value="">All</option>
          <option value="1">🔶 Hero only</option>
        </select>
      </div>

      <div className="fgroup">
        <label>Priority</label>
        <select value={filters.prio} onChange={(e) => onFilterChange({ prio: e.target.value })}>
          <option value="">All</option>
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
          <option value="__none">Unset</option>
        </select>
      </div>

      <div className="fgroup">
        <label>Sort</label>
        <select value={filters.sort} onChange={(e) => onFilterChange({ sort: e.target.value })}>
          <option value="">Default</option>
          <option value="prio">Priority ↓</option>
          <option value="eff">Effort ↑</option>
        </select>
      </div>

      <button className="btn" type="button" onClick={onClear}>
        Clear
      </button>
      <button className="btn btn-add" type="button" onClick={onAddCheck}>
        ＋ Add check
      </button>
      <a
        className="btn btn-exp"
        href="/api/export/xlsx"
        title="Download all checks (latest version of each) as an Excel file"
      >
        ⬇ Export XLSX
      </a>
      <span className="count-chip">
        <b>{shownCount}</b> of {totalCount}
        {customCount ? ' · ' + customCount + ' custom' : ''}
      </span>
      <ThemeToggle />
    </div>
  );
}
