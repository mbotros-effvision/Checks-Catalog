// Pure comparison of the Mamta checklist against the feasibility catalog.
// No DOM, no React, no database import — unit-tested.
//
// The curated judgment lives in data/comparison-map.ts; this module only
// resolves it against whatever catalog rows are live right now, which is what
// lets user-added custom checks fall into "only in catalog" automatically.
import type {
  CatalogRef,
  CheckRow,
  ComparisonGap,
  ComparisonLink,
  ComparisonPair,
  ComparisonResult,
  MamtaMapping,
  MamtaRow,
} from '@/types';

/** Separates the optional pillar qualifier in a ref: "Pillar :: Check name". */
export const REF_QUALIFIER = ' :: ';

export function qualifiedRef(pillar: string, check: string): CatalogRef {
  return pillar + REF_QUALIFIER + check;
}

/** Index rows under both their bare name and their pillar-qualified name, so a
 *  ref can disambiguate the three catalog names that appear in two pillars. */
function indexCatalog(catalog: CheckRow[]): Map<CatalogRef, CheckRow[]> {
  const index = new Map<CatalogRef, CheckRow[]>();
  const add = (key: CatalogRef, row: CheckRow) => {
    const arr = index.get(key);
    if (arr) arr.push(row);
    else index.set(key, [row]);
  };
  for (const row of catalog) {
    add(row.check, row);
    add(qualifiedRef(row.pillar, row.check), row);
  }
  return index;
}

/** Flatten the per-Mamta-check pairs into one row per (Mamta, catalog) link, so
 *  every displayed row is 1-to-1. A Mamta check mapping to two catalog checks
 *  is emitted twice; a catalog check claimed by the US and Ex-US rows likewise.
 *  Both sides then carry a repeat count, so the duplication is visible as
 *  intent rather than looking like a bug. */
function buildLinks(
  matched: ComparisonPair[],
  near: ComparisonPair[],
  gaps: ComparisonGap[],
  catalogOnly: CheckRow[],
): ComparisonLink[] {
  const links: ComparisonLink[] = [];

  const fromPairs = (pairs: ComparisonPair[], kind: 'match' | 'near') => {
    for (const p of pairs) {
      // A pair whose refs all failed to resolve still deserves a row, so the
      // broken reference is visible instead of the check silently vanishing.
      if (p.catalog.length === 0) {
        links.push({
          key: p.mamta.id, kind, mamta: p.mamta, catalog: null,
          note: p.note, unresolved: p.unresolved, mamtaRepeat: 1, catalogRepeat: 1,
        });
        continue;
      }
      for (const c of p.catalog) {
        links.push({
          key: p.mamta.id + '->' + c.id, kind, mamta: p.mamta, catalog: c,
          note: p.note, unresolved: p.unresolved, mamtaRepeat: 1, catalogRepeat: 1,
        });
      }
    }
  };

  fromPairs(matched, 'match');
  fromPairs(near, 'near');
  for (const g of gaps) {
    links.push({
      key: g.mamta.id, kind: 'mamta-only', mamta: g.mamta, catalog: null,
      note: g.note, unresolved: [], mamtaRepeat: 1, catalogRepeat: 1,
    });
  }
  for (const c of catalogOnly) {
    links.push({
      key: 'catalog-' + c.id, kind: 'catalog-only', mamta: null, catalog: c,
      note: '', unresolved: [], mamtaRepeat: 1, catalogRepeat: 1,
    });
  }

  // Counted WITHIN each bucket, not across all of them: the UI shows one bucket
  // at a time, and a marker claiming rows the reader cannot see is worse than
  // no marker. Four catalog checks are reached by both a match and a near, so a
  // global count would overstate their repeats on the matched tab.
  const mamtaSeen = new Map<string, number>();
  const catalogSeen = new Map<string, number>();
  for (const l of links) {
    if (l.mamta) mamtaSeen.set(l.kind + '|' + l.mamta.id, (mamtaSeen.get(l.kind + '|' + l.mamta.id) ?? 0) + 1);
    if (l.catalog) catalogSeen.set(l.kind + '|' + l.catalog.id, (catalogSeen.get(l.kind + '|' + l.catalog.id) ?? 0) + 1);
  }
  for (const l of links) {
    l.mamtaRepeat = l.mamta ? mamtaSeen.get(l.kind + '|' + l.mamta.id)! : 1;
    l.catalogRepeat = l.catalog ? catalogSeen.get(l.kind + '|' + l.catalog.id)! : 1;
  }

  return links;
}

export function buildComparison(
  mamta: MamtaRow[],
  catalog: CheckRow[],
  map: MamtaMapping[],
): ComparisonResult {
  const byId = new Map(map.map((m) => [m.mamtaId, m]));
  const index = indexCatalog(catalog);

  const matched: ComparisonPair[] = [];
  const near: ComparisonPair[] = [];
  const gaps: ComparisonGap[] = [];
  const unmapped: MamtaRow[] = [];
  // Catalog row ids, not names: a check referenced by both a US and an Ex-US
  // Mamta row is covered once, so it is never double-counted. Tracked per
  // relation so the catalog side partitions the same three ways the Mamta side
  // does — see ComparisonCounts.
  const matchedIds = new Set<number>();
  const nearIds = new Set<number>();

  for (const row of mamta) {
    const entry = byId.get(row.id);
    if (!entry) {
      unmapped.push(row);
      continue;
    }
    if (entry.relation === 'gap' || entry.catalog.length === 0) {
      gaps.push({ mamta: row, note: entry.note ?? '' });
      continue;
    }

    const isNear = entry.relation === 'near';
    const reached = isNear ? nearIds : matchedIds;
    const resolved: CheckRow[] = [];
    const unresolved: CatalogRef[] = [];
    for (const ref of entry.catalog) {
      const hits = index.get(ref) ?? [];
      if (hits.length === 0) unresolved.push(ref);
      for (const hit of hits) {
        reached.add(hit.id);
        if (!resolved.includes(hit)) resolved.push(hit);
      }
    }

    const pair: ComparisonPair = { mamta: row, catalog: resolved, unresolved, note: entry.note ?? '' };
    (isNear ? near : matched).push(pair);
  }

  // A catalog check reached by both relations counts as matched — the stronger
  // one wins, which keeps the three catalog buckets disjoint.
  const catalogNear = [...nearIds].filter((id) => !matchedIds.has(id));
  const covered = new Set<number>([...matchedIds, ...catalogNear]);
  const catalogOnly = catalog.filter((c) => !covered.has(c.id));
  const links = buildLinks(matched, near, gaps, catalogOnly);

  return {
    matched,
    near,
    gaps,
    catalogOnly,
    links,
    unmapped,
    counts: {
      matchedPairs: links.filter((l) => l.kind === 'match').length,
      nearPairs: links.filter((l) => l.kind === 'near').length,
      mamtaTotal: mamta.length,
      matched: matched.length,
      near: near.length,
      gaps: gaps.length,
      unmapped: unmapped.length,
      catalogTotal: catalog.length,
      catalogMatched: matchedIds.size,
      catalogNear: catalogNear.length,
      catalogCovered: covered.size,
      catalogOnly: catalogOnly.length,
    },
  };
}
