// Pure filtering + sorting for the appendix table. No DOM, no React — unit-tested.
import type { CheckRow, Filters } from '@/types';
import { BUCKETS, EFFORT_RANK, PRIO_RANK } from './taxonomy';

export const EMPTY_FILTERS: Filters = {
  search: '', pillar: '', source: '', bucket: '', mvp: '',
  effort: '', phase: '', hero: '', prio: '', sort: '',
};

/**
 * Filter + sort base checks. Priority/MVP are read straight off the row.
 * When `filters.sort` is empty the input order is preserved (the table then
 * groups by pillar); sorting by priority/effort disables grouping upstream.
 */
export function filteredRows(rows: CheckRow[], filters: Filters): CheckRow[] {
  const q = filters.search.trim().toLowerCase();

  let out = rows.filter((r) => {
    if (filters.pillar && r.pillar !== filters.pillar) return false;
    if (filters.source && r.source !== filters.source) return false;
    if (filters.bucket && r.bucket !== filters.bucket) return false;
    if (filters.effort && r.effort !== filters.effort) return false;
    if (filters.phase && r.phase !== filters.phase) return false;
    if (filters.hero && !r.hero) return false;
    if (filters.mvp && r.mvp !== filters.mvp) return false;
    if (filters.prio) {
      if (filters.prio === '__none') {
        if (r.priority) return false;
      } else if (r.priority !== filters.prio) return false;
    }
    if (q) {
      const hay = (
        r.pillar + ' ' + r.check + ' ' + r.plainEnglish + ' ' + r.how + ' ' + r.source + ' ' + BUCKETS[r.bucket].label
      ).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });

  if (filters.sort === 'prio') {
    out = out.slice().sort((a, b) => PRIO_RANK[b.priority] - PRIO_RANK[a.priority]);
  } else if (filters.sort === 'eff') {
    out = out.slice().sort((a, b) => EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort]);
  }

  return out;
}
