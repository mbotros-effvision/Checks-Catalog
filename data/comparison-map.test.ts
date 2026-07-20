// Guards the two hand-maintained data files against each other and against the
// catalog. A single typo in a catalog ref would otherwise turn a matched check
// into a phantom gap AND push a covered catalog check into "only in catalog" —
// two wrong numbers, no runtime error.
import { describe, expect, it } from 'vitest';
import { CHECKS } from './checks';
import { MAMTA_CHECKS } from './mamta-checks';
import { COMPARISON_MAP } from './comparison-map';
import { REF_QUALIFIER } from '@/lib/comparison';

const VERSION_SLUG: Record<string, string> = { US: 'us', 'Ex-US': 'exus', Both: 'both' };

/** Re-derived here independently of scripts/extract-mamta.mjs. */
function idFor(version: string, category: string, number: number): string {
  const cat = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${VERSION_SLUG[version]}-${cat}-${String(number).padStart(2, '0')}`;
}

describe('MAMTA_CHECKS', () => {
  it('holds all 174 checks with unique, derivable ids', () => {
    expect(MAMTA_CHECKS).toHaveLength(174);
    expect(new Set(MAMTA_CHECKS.map((m) => m.id)).size).toBe(174);
    for (const m of MAMTA_CHECKS) {
      expect(m.id).toBe(idFor(m.version, m.category, m.number));
    }
  });

  it('splits into the expected per-version counts', () => {
    const count = (v: string) => MAMTA_CHECKS.filter((m) => m.version === v).length;
    expect(count('US')).toBe(75);
    expect(count('Ex-US')).toBe(76);
    expect(count('Both')).toBe(23);
  });

  it('has a section on every row', () => {
    for (const m of MAMTA_CHECKS) expect(m.section, m.id).not.toBe('');
  });

  // `seq` is derived in SQL as sort_order + 1, and sort_order is the seed array
  // index — so the running 1..174 shown in the # column is exactly this order.
  it('is ordered so the running number runs 1..174 without gaps', () => {
    expect(MAMTA_CHECKS.map((_, i) => i + 1)).toEqual(
      Array.from({ length: MAMTA_CHECKS.length }, (_, i) => i + 1),
    );
    // and the order is tab-contiguous, which is what keeps the bands whole
    const seenTabs = new Set<string>();
    let lastTab = '';
    for (const m of MAMTA_CHECKS) {
      const tab = m.version + '/' + m.category;
      if (tab === lastTab) continue;
      expect(seenTabs.has(tab), `tab "${tab}" is split across the array`).toBe(false);
      seenTabs.add(tab);
      lastTab = tab;
    }
  });
});

describe('COMPARISON_MAP', () => {
  const mamtaIds = new Set(MAMTA_CHECKS.map((m) => m.id));

  it('has exactly one entry per Mamta check and no strays', () => {
    expect(COMPARISON_MAP).toHaveLength(MAMTA_CHECKS.length);
    const seen = new Set<string>();
    for (const entry of COMPARISON_MAP) {
      expect(mamtaIds.has(entry.mamtaId), `unknown mamtaId "${entry.mamtaId}"`).toBe(true);
      expect(seen.has(entry.mamtaId), `duplicate entry for "${entry.mamtaId}"`).toBe(false);
      seen.add(entry.mamtaId);
    }
    for (const id of mamtaIds) expect(seen.has(id), `no mapping entry for "${id}"`).toBe(true);
  });

  it('pairs the gap relation with an empty catalog list, and only that', () => {
    for (const entry of COMPARISON_MAP) {
      if (entry.relation === 'gap') expect(entry.catalog, entry.mamtaId).toHaveLength(0);
      else expect(entry.catalog.length, entry.mamtaId).toBeGreaterThan(0);
    }
  });

  it('gives every gap and near a note explaining it', () => {
    for (const entry of COMPARISON_MAP) {
      if (entry.relation !== 'match') expect(entry.note, entry.mamtaId).toBeTruthy();
    }
  });

  // The one that actually catches typos: a ref matching zero rows is a
  // misspelling, and one matching two rows is an ambiguous name that needs the
  // "Pillar :: Check name" qualifier.
  it('resolves every catalog ref to exactly one catalog check', () => {
    for (const entry of COMPARISON_MAP) {
      for (const ref of entry.catalog) {
        const hits = ref.includes(REF_QUALIFIER)
          ? CHECKS.filter((c) => c.pillar + REF_QUALIFIER + c.check === ref)
          : CHECKS.filter((c) => c.check === ref);
        expect(hits.length, `"${ref}" (${entry.mamtaId}) matched ${hits.length} catalog checks`).toBe(1);
      }
    }
  });

  it('only qualifies refs that actually need it', () => {
    const byName = new Map<string, number>();
    for (const c of CHECKS) byName.set(c.check, (byName.get(c.check) ?? 0) + 1);
    for (const entry of COMPARISON_MAP) {
      for (const ref of entry.catalog) {
        if (!ref.includes(REF_QUALIFIER)) continue;
        const bare = ref.slice(ref.indexOf(REF_QUALIFIER) + REF_QUALIFIER.length);
        expect((byName.get(bare) ?? 0) > 1, `"${ref}" is qualified but "${bare}" is already unique`).toBe(true);
      }
    }
  });
});
