import { describe, expect, it } from 'vitest';
import type { MamtaFilters, MamtaRow } from '@/types';
import { MAMTA_CHECKS } from '@/data/mamta-checks';
import { EMPTY_MAMTA_FILTERS, filteredMamta } from './mamta-filters';

const f = (patch: Partial<MamtaFilters>): MamtaFilters => ({ ...EMPTY_MAMTA_FILTERS, ...patch });

function mk(partial: Partial<MamtaRow> & Pick<MamtaRow, 'id' | 'version' | 'category'>): MamtaRow {
  return {
    section: 'Section',
    number: 1,
    check: 'A check',
    url: '/',
    steps: 'Do the thing',
    expected: 'It works',
    priority: 'High',
    ...partial,
  };
}

const rows: MamtaRow[] = [
  mk({ id: 'us-homepage-01', version: 'US', category: 'Homepage', check: 'Hero headline renders' }),
  mk({ id: 'exus-homepage-01', version: 'Ex-US', category: 'Homepage', check: 'Hero without US claims', priority: 'Medium' }),
  mk({ id: 'both-geo-detection-01', version: 'Both', category: 'Geo Detection', check: 'US IP serves US version' }),
];

describe('filteredMamta', () => {
  it('returns all rows with empty filters', () => {
    expect(filteredMamta(rows, EMPTY_MAMTA_FILTERS)).toHaveLength(3);
  });

  it('keeps Both rows when filtering to a specific version', () => {
    expect(filteredMamta(rows, f({ version: 'US' })).map((r) => r.id)).toEqual([
      'us-homepage-01',
      'both-geo-detection-01',
    ]);
    expect(filteredMamta(rows, f({ version: 'Ex-US' })).map((r) => r.id)).toEqual([
      'exus-homepage-01',
      'both-geo-detection-01',
    ]);
  });

  it('shows only shared rows when filtering to Both', () => {
    expect(filteredMamta(rows, f({ version: 'Both' })).map((r) => r.id)).toEqual(['both-geo-detection-01']);
  });

  it('filters by category and priority', () => {
    expect(filteredMamta(rows, f({ category: 'Homepage' }))).toHaveLength(2);
    expect(filteredMamta(rows, f({ priority: 'Medium' })).map((r) => r.id)).toEqual(['exus-homepage-01']);
  });

  it('searches across check, steps, expected and url', () => {
    expect(filteredMamta(rows, f({ search: 'US claims' })).map((r) => r.id)).toEqual(['exus-homepage-01']);
    expect(filteredMamta(rows, f({ search: 'do the thing' }))).toHaveLength(3);
    expect(filteredMamta(rows, f({ search: 'nothing matches this' }))).toHaveLength(0);
  });

  it('preserves input order so category/section bands stay contiguous', () => {
    const shuffled = [rows[2], rows[0], rows[1]];
    expect(filteredMamta(shuffled, EMPTY_MAMTA_FILTERS).map((r) => r.id)).toEqual(shuffled.map((r) => r.id));
  });

  // Guards the real numbers behind the "US view shows 98, not 75" expectation.
  it('applies the Both rule to the real data set', () => {
    expect(MAMTA_CHECKS).toHaveLength(174);
    expect(filteredMamta(MAMTA_CHECKS, f({ version: 'US' }))).toHaveLength(98); // 75 US + 23 shared
    expect(filteredMamta(MAMTA_CHECKS, f({ version: 'Ex-US' }))).toHaveLength(99); // 76 Ex-US + 23 shared
  });
});
