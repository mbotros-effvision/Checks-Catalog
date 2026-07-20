import { describe, expect, it } from 'vitest';
import type { CheckRow, Filters } from '@/types';
import { EMPTY_FILTERS, filteredRows } from './filters';

const f = (patch: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...patch });

let nextId = 1;
function mk(partial: Partial<CheckRow> & Pick<CheckRow, 'pillar' | 'check'>): CheckRow {
  return {
    id: nextId++,
    pillarId: 1,
    plainEnglish: '',
    mvp: 'Post-MVP',
    bucket: 'human',
    effort: 'N/A',
    how: '',
    source: 'Snurra QA',
    hero: false,
    phase: 'A',
    dupOf: '',
    priority: '',
    custom: false,
    active: true,
    justification: '',
    ...partial,
  };
}

const rows: CheckRow[] = [
  mk({ pillar: 'Homepage', check: 'Hero renders', bucket: 'spectera', effort: 'Live', phase: 'A', hero: true }),
  mk({ pillar: 'Homepage', check: 'CTA present', bucket: 'human', effort: 'High', phase: 'B', source: 'Presales', mvp: 'MVP' }),
  mk({ pillar: 'SSL & Domain Health', check: 'Cert valid', bucket: 'thirdparty', effort: 'Low', source: 'Spectera' }),
];

describe('filteredRows', () => {
  it('returns all rows with empty filters', () => {
    expect(filteredRows(rows, EMPTY_FILTERS)).toHaveLength(3);
  });

  it('filters by source / effort', () => {
    expect(filteredRows(rows, f({ source: 'Presales' })).map((x) => x.check)).toEqual(['CTA present']);
    expect(filteredRows(rows, f({ effort: 'High' }))).toHaveLength(1);
  });

  it('search matches pillar, check, source, and bucket label', () => {
    expect(filteredRows(rows, f({ search: 'cta' }))).toHaveLength(1);
    expect(filteredRows(rows, f({ search: 'homepage' }))).toHaveLength(2);
  });

  it('priority __none matches only unset rows; a value matches that value', () => {
    const withPrio = [mk({ pillar: 'P', check: 'A', priority: 'high' }), mk({ pillar: 'P', check: 'B', priority: '' })];
    expect(filteredRows(withPrio, f({ prio: '__none' }))).toHaveLength(1);
    expect(filteredRows(withPrio, f({ prio: 'high' }))).toHaveLength(1);
  });

  it('mvp filter reads the row value', () => {
    expect(filteredRows(rows, f({ mvp: 'MVP' })).map((x) => x.check)).toEqual(['CTA present']);
  });

  it('sorts by effort ascending (Live < Low < High)', () => {
    expect(filteredRows(rows, f({ sort: 'eff' })).map((x) => x.effort)).toEqual(['Live', 'Low', 'High']);
  });

  it('sorts by priority descending (unset sinks to bottom)', () => {
    const withPrio = [
      mk({ pillar: 'P', check: 'none' }),
      mk({ pillar: 'P', check: 'high', priority: 'high' }),
      mk({ pillar: 'P', check: 'low', priority: 'low' }),
    ];
    const r = filteredRows(withPrio, f({ sort: 'prio' }));
    expect(r[0].check).toBe('high');
    expect(r[r.length - 1].check).toBe('none');
  });
});
