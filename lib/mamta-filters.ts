// Pure filtering for the Mamta checklist table. No DOM, no React — unit-tested.
// Separate from lib/filters.ts on purpose: the Mamta rows have no pillar,
// source, MVP or effort, so sharing `Filters` would force dead fields on both.
import type { MamtaCheck, MamtaFilters } from '@/types';

export const EMPTY_MAMTA_FILTERS: MamtaFilters = { search: '', version: '', category: '', priority: '' };

/**
 * Filter Mamta checks. Input order is always preserved — rows arrive in
 * workbook order, which is what keeps the table's category/section bands
 * contiguous.
 *
 * Filtering by a specific site version also keeps `Both` rows: Geo Detection
 * and GDPR Compliance apply to the US and Ex-US sites alike, so excluding them
 * would silently drop 23 checks from either view.
 */
export function filteredMamta<T extends MamtaCheck>(rows: T[], filters: MamtaFilters): T[] {
  const q = filters.search.trim().toLowerCase();

  return rows.filter((r) => {
    if (filters.version && r.version !== filters.version && r.version !== 'Both') return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.priority && r.priority !== filters.priority) return false;
    if (q) {
      const hay = (
        r.check + ' ' + r.section + ' ' + r.steps + ' ' + r.expected + ' ' + r.url + ' ' + r.category
      ).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });
}
