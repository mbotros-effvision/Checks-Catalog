import { describe, expect, it } from 'vitest';
import type { CheckRow, MamtaMapping, MamtaRow } from '@/types';
import { buildComparison } from './comparison';

let nextId = 1;
function cat(pillar: string, check: string): CheckRow {
  return {
    id: nextId++, pillarId: 1, pillar, check, plainEnglish: '', bucket: 'human', effort: 'N/A',
    how: '', source: 'Snurra QA', hero: false, phase: 'A', dupOf: '', mvp: 'Post-MVP',
    priority: '', custom: false, active: true, justification: '',
  };
}

function mamta(id: string): MamtaRow {
  return {
    id, version: 'US', category: 'Homepage', section: 'Section', number: 1,
    check: 'A check', url: '/', steps: '', expected: '', priority: 'High',
  };
}

describe('buildComparison', () => {
  it('counts a catalog check once when several Mamta rows map to it', () => {
    const hero = cat('Homepage', 'Hero CTA buttons functional');
    const other = cat('Homepage', 'Logo links back to homepage');
    const rows = [mamta('us-homepage-02'), mamta('exus-homepage-02')];
    const map: MamtaMapping[] = rows.map((r) => ({
      mamtaId: r.id, relation: 'match', catalog: ['Hero CTA buttons functional'],
    }));

    const r = buildComparison(rows, [hero, other], map);

    expect(r.matched).toHaveLength(2); // both Mamta rows still render their own pair
    expect(r.counts.catalogCovered).toBe(1); // …but the catalog check is covered once
    expect(r.catalogOnly.map((c) => c.check)).toEqual(['Logo links back to homepage']);
  });

  it('disambiguates a duplicated catalog name via the pillar qualifier', () => {
    const homepage = cat('Homepage', 'Profiling cookies off by default (Ex-US)');
    const security = cat('Security', 'Profiling cookies off by default (Ex-US)');
    const row = mamta('exus-homepage-12');

    const r = buildComparison([row], [homepage, security], [
      { mamtaId: row.id, relation: 'match', catalog: ['Homepage :: Profiling cookies off by default (Ex-US)'] },
    ]);

    expect(r.matched[0].catalog).toEqual([homepage]);
    expect(r.catalogOnly).toEqual([security]);
  });

  it('resolves a bare ref to every row sharing that name', () => {
    const homepage = cat('Homepage', 'Profiling cookies off by default (Ex-US)');
    const security = cat('Security', 'Profiling cookies off by default (Ex-US)');
    const row = mamta('exus-homepage-12');

    const r = buildComparison([row], [homepage, security], [
      { mamtaId: row.id, relation: 'match', catalog: ['Profiling cookies off by default (Ex-US)'] },
    ]);

    expect(r.matched[0].catalog).toHaveLength(2);
    expect(r.catalogOnly).toHaveLength(0);
  });

  it('reports a ref that matches no live catalog row instead of throwing', () => {
    const row = mamta('us-homepage-01');
    const r = buildComparison([row], [cat('Homepage', 'Hero headline renders correctly')], [
      { mamtaId: row.id, relation: 'match', catalog: ['A check that was renamed'] },
    ]);

    expect(r.matched[0].unresolved).toEqual(['A check that was renamed']);
    expect(r.matched[0].catalog).toHaveLength(0);
    expect(r.counts.catalogOnly).toBe(1);
  });

  it('buckets gaps, nears and unmapped rows separately', () => {
    const check = cat('Homepage', 'Hero headline renders correctly');
    const rows = [mamta('a'), mamta('b'), mamta('c')];
    const r = buildComparison(rows, [check], [
      { mamtaId: 'a', relation: 'gap', catalog: [], note: 'nothing covers this' },
      { mamtaId: 'b', relation: 'near', catalog: ['Hero headline renders correctly'], note: 'close' },
      // 'c' deliberately has no entry
    ]);

    expect(r.gaps.map((g) => g.mamta.id)).toEqual(['a']);
    expect(r.near.map((n) => n.mamta.id)).toEqual(['b']);
    expect(r.unmapped.map((u) => u.id)).toEqual(['c']);
    expect(r.gaps[0].note).toBe('nothing covers this');
  });

  it('treats an empty catalog list as a gap even when the relation says otherwise', () => {
    const row = mamta('a');
    const r = buildComparison([row], [cat('Homepage', 'Something')], [
      { mamtaId: 'a', relation: 'match', catalog: [] },
    ]);
    expect(r.counts.gaps).toBe(1);
    expect(r.counts.matched).toBe(0);
  });

  it('keeps both count invariants', () => {
    const catalog = [cat('Homepage', 'One'), cat('Homepage', 'Two'), cat('Security', 'Three')];
    const rows = [mamta('a'), mamta('b'), mamta('c'), mamta('d')];
    const r = buildComparison(rows, catalog, [
      { mamtaId: 'a', relation: 'match', catalog: ['One'] },
      { mamtaId: 'b', relation: 'match', catalog: ['One'] },
      { mamtaId: 'c', relation: 'near', catalog: ['Two'], note: 'close' },
      { mamtaId: 'd', relation: 'gap', catalog: [], note: 'absent' },
    ]);

    const c = r.counts;
    expect(c.matched + c.near + c.gaps + c.unmapped).toBe(c.mamtaTotal);
    expect(c.catalogCovered + c.catalogOnly).toBe(c.catalogTotal);
  });
});
