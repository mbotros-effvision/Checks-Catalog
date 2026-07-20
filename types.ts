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
