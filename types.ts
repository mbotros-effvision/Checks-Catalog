// Shared domain types for the Pillar Feasibility report.

export type BucketKey = 'spectera' | 'thirdparty' | 'agentic' | 'build' | 'human';
export type Effort = 'Live' | 'Low' | 'Medium' | 'High' | 'N/A';
export type Phase = 'A' | 'B';
export type Mvp = 'MVP' | 'Post-MVP' | 'Duplicated';
export type Prio = 'high' | 'med' | 'low' | '';

/** Seed shape (the 200 built-in rows in `data/checks.ts`). No id — that is
 *  assigned by the database when the rows are seeded. */
export interface Check {
  pillar: string;
  check: string;
  plainEnglish: string;
  mvp: Mvp;
  bucket: BucketKey; // feasibility
  effort: Effort;
  how: string;
  source: string;
  hero: boolean;
  phase: Phase;
  roadmap: string;
  dupOf?: string;
}

/** A pillar entity (row in the `pillars` table). */
export interface PillarRow {
  id: number;
  name: string;
}

/** A check as stored/returned by the database — the runtime source of truth.
 *  `id` is the sequential primary key; `pillar` is joined from the pillar the
 *  check references via `pillarId`. */
export interface CheckRow {
  id: number;
  pillarId: number;
  pillar: string;
  check: string;
  plainEnglish: string;
  bucket: BucketKey; // feasibility
  effort: Effort;
  how: string;
  source: string;
  hero: boolean;
  phase: Phase;
  dupOf: string;
  mvp: Mvp;
  priority: Prio;
  roadmap: string;
  custom: boolean; // false for seeded reference rows, true for user-added
  active: boolean; // review-workflow: false = deactivated by the team
  justification: string; // reason for deactivation / review notes
}

/** Payload for creating/updating a check. The pillar is addressed by name; the
 *  server resolves/creates the pillar and returns the stored row. */
export interface CheckInput {
  pillar: string;
  check: string;
  plainEnglish: string;
  bucket: BucketKey;
  effort: Effort;
  how: string;
  source: string;
  hero: boolean;
  phase: Phase;
  dupOf: string;
  mvp: Mvp;
  priority: Prio;
  roadmap: string;
}

/** An editable version of a check (row in `check_iterations`) — a full snapshot
 *  of the check's fields plus a per-check version number and optional comment. */
export interface IterationRow {
  id: number;
  checkId: number;
  version: number; // 1, 2, 3… per check
  comment: string;
  pillar: string;
  check: string;
  plainEnglish: string;
  bucket: BucketKey;
  effort: Effort;
  how: string;
  source: string;
  hero: boolean;
  phase: Phase;
  dupOf: string;
  mvp: Mvp;
  priority: Prio;
  roadmap: string;
  createdAt: string;
}

/** Payload for creating/updating a version. `version` is server-assigned on create. */
export interface IterationInput extends CheckInput {
  comment: string;
}

/** What one table row renders: a base check with a chosen version applied.
 *  The field values come from the base check (Base) or the selected version. */
export interface DisplayRow {
  checkId: number;
  custom: boolean;
  active: boolean;
  justification: string;
  versionLabel: string; // 'Base' | 'v1' | 'v2' …
  selectedIterationId: number; // 0 = base
  versions: IterationRow[];
  pillar: string;
  check: string;
  plainEnglish: string;
  bucket: BucketKey;
  effort: Effort;
  how: string;
  source: string;
  hero: boolean;
  phase: Phase;
  dupOf: string;
  mvp: Mvp;
  priority: Prio;
  roadmap: string;
  /** Prefill for a NEW version: a copy of the latest version, or the base check
   *  with How blanked when there are no versions yet. */
  newVersionInput: CheckInput;
}

export interface BucketMeta {
  label: string;
  icon: string;
  color: string;
  bg: string;
  desc: string;
}

/** The current toolbar filter/sort state. */
export interface Filters {
  search: string;
  pillar: string;
  source: string;
  mvp: string;
  effort: string;
  prio: string; // '' | 'high' | 'med' | 'low' | '__none'
  sort: string; // '' | 'prio' | 'eff'
}

// ---------------------------------------------------------------------------
// Mamta QA checklist — read-only reference data imported from the QA workbook.
// ---------------------------------------------------------------------------

export type MamtaVersion = 'US' | 'Ex-US' | 'Both';
export type MamtaPriority = 'High' | 'Medium';

/** Seed shape (the 174 rows in `data/mamta-checks.ts`). Unlike `Check`, the id
 *  is authored — a stable slug derived from (version, category, number), which
 *  is what `data/comparison-map.ts` keys off. */
export interface MamtaCheck {
  id: string; // 'us-homepage-01' | 'exus-content-17' | 'both-geo-detection-11'
  version: MamtaVersion;
  category: string; // workbook tab, e.g. 'Homepage'
  section: string; // in-tab group header, e.g. 'Hero & Above the Fold'
  number: number; // row number within its tab
  check: string;
  url: string;
  steps: string;
  expected: string;
  priority: MamtaPriority;
}

/** A Mamta check as stored/returned by the database. Adds `seq`, the running
 *  1..N position in workbook order — assigned by the store, the way `CheckRow`
 *  adds a database-assigned `id`. `number` stays the in-tab row number, which
 *  is what the workbook itself shows and what the id is built from. */
export interface MamtaRow extends MamtaCheck {
  seq: number;
}

/** The Mamta table's filter state. */
export interface MamtaFilters {
  search: string;
  version: string; // '' | 'US' | 'Ex-US' | 'Both'
  category: string; // '' | a workbook tab name
  priority: string; // '' | 'High' | 'Medium'
}

// ---------------------------------------------------------------------------
// Comparison — Mamta checklist vs the feasibility catalog.
// ---------------------------------------------------------------------------

export type MamtaRelation = 'match' | 'near' | 'gap';

/** Reference to a catalog check by NAME. Three catalog names are not unique, so
 *  a ref may be pillar-qualified as "Pillar :: Check name". */
export type CatalogRef = string;

/** One curated entry in `data/comparison-map.ts` — exactly one per Mamta check. */
export interface MamtaMapping {
  mamtaId: string;
  relation: MamtaRelation;
  catalog: CatalogRef[]; // [] iff relation === 'gap'
  note?: string;
}

/** A Mamta check resolved against live catalog rows. `catalog` may hold more
 *  than one row (one Mamta check split across several), and the same catalog
 *  row may appear in several pairs (a US and an Ex-US row mapping to one check). */
export interface ComparisonPair {
  mamta: MamtaRow;
  catalog: CheckRow[];
  unresolved: CatalogRef[]; // refs matching no live row — a renamed/deleted check
  note: string;
}

export interface ComparisonGap {
  mamta: MamtaRow;
  note: string;
}

export type LinkKind = 'match' | 'near' | 'mamta-only' | 'catalog-only';

/** One displayed row of the comparison: exactly one Mamta check against exactly
 *  one catalog check. A Mamta check covering two catalog checks produces two
 *  links, and a catalog check covered by the US and Ex-US rows produces two —
 *  so a check can legitimately appear on more than one row. `mamtaRepeat` /
 *  `catalogRepeat` say how many rows that side appears on (1 = only this one),
 *  which is what the UI marks so a repeat does not read as a data error. */
export interface ComparisonLink {
  key: string;
  kind: LinkKind;
  mamta: MamtaRow | null; // null on catalog-only rows
  catalog: CheckRow | null; // null on Mamta-only rows
  note: string;
  unresolved: CatalogRef[];
  mamtaRepeat: number;
  catalogRepeat: number;
}

/** Two independent partitions, one per catalog:
 *    matched + near + gaps + unmapped === mamtaTotal
 *    catalogMatched + catalogNear + catalogOnly === catalogTotal
 *  The two sides describe the same overlap from opposite ends, so they must not
 *  be added together — `matched` counts Mamta rows, `catalogMatched` counts the
 *  (fewer) catalog checks those rows resolve to. */
export interface ComparisonCounts {
  mamtaTotal: number;
  matched: number;
  near: number;
  gaps: number;
  unmapped: number;
  /** Displayed rows. Every row is one Mamta check against one catalog check,
   *  so these four partition `links` exactly:
   *    matchedPairs + nearPairs + gaps + catalogOnly === links.length
   *  They exceed `matched` / `near` because a check on either side can appear
   *  on more than one row. */
  matchedPairs: number;
  nearPairs: number;
  catalogTotal: number;
  /** Catalog checks reached by at least one `match` mapping. */
  catalogMatched: number;
  /** Catalog checks reached ONLY by `near` mappings — a check reached by both
   *  counts as matched, since the stronger relation wins. */
  catalogNear: number;
  catalogCovered: number; // catalogMatched + catalogNear
  catalogOnly: number;
}

export interface ComparisonResult {
  matched: ComparisonPair[];
  near: ComparisonPair[];
  gaps: ComparisonGap[];
  catalogOnly: CheckRow[];
  /** The pair-level projection the UI renders — see ComparisonLink. */
  links: ComparisonLink[];
  /** Mamta rows with no entry in the map — an authoring hole, surfaced rather
   *  than silently bucketed. Empty once the map is complete. */
  unmapped: MamtaRow[];
  counts: ComparisonCounts;
}
