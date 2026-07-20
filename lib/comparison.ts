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
  // Mamta row is covered once, so it is never double-counted.
  const covered = new Set<number>();

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

    const resolved: CheckRow[] = [];
    const unresolved: CatalogRef[] = [];
    for (const ref of entry.catalog) {
      const hits = index.get(ref) ?? [];
      if (hits.length === 0) unresolved.push(ref);
      for (const hit of hits) {
        covered.add(hit.id);
        if (!resolved.includes(hit)) resolved.push(hit);
      }
    }

    const pair: ComparisonPair = { mamta: row, catalog: resolved, unresolved, note: entry.note ?? '' };
    (entry.relation === 'near' ? near : matched).push(pair);
  }

  const catalogOnly = catalog.filter((c) => !covered.has(c.id));

  return {
    matched,
    near,
    gaps,
    catalogOnly,
    unmapped,
    counts: {
      mamtaTotal: mamta.length,
      matched: matched.length,
      near: near.length,
      gaps: gaps.length,
      unmapped: unmapped.length,
      catalogTotal: catalog.length,
      catalogCovered: covered.size,
      catalogOnly: catalogOnly.length,
    },
  };
}
