// Server-only SQLite persistence (better-sqlite3). Import ONLY from route
// handlers / server code — never from a client component.
//
// Relational model:
//   pillars(id, name UNIQUE, layer)
//   checks(id, pillar_id -> pillars.id, name, plain_english, feasibility,
//          effort, how, source, hero, phase, dup_of, mvp, priority, custom)
// The 200 reference checks (data/checks.ts) are seeded once as normal, editable
// rows with sequential ids. `id` is the sole identity.
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { CheckInput, CheckRow, IterationInput, IterationRow, Layer, PillarRow } from '@/types';
import { CHECKS } from '@/data/checks';
import { layerOf } from '@/lib/taxonomy';

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (_db) return _db;
  const dir = process.env.DATA_DIR || path.join(process.cwd(), '.data');
  fs.mkdirSync(dir, { recursive: true });
  const d = new Database(path.join(dir, 'feasibility.db'));
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');
  d.exec(`
    CREATE TABLE IF NOT EXISTS pillars (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT UNIQUE NOT NULL,
      layer TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      pillar_id     INTEGER NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      plain_english TEXT NOT NULL DEFAULT '',
      feasibility   TEXT NOT NULL,
      effort        TEXT NOT NULL,
      how           TEXT NOT NULL DEFAULT '',
      source        TEXT NOT NULL,
      hero          INTEGER NOT NULL DEFAULT 0,
      phase         TEXT NOT NULL,
      dup_of        TEXT NOT NULL DEFAULT '',
      mvp           TEXT NOT NULL,
      priority      TEXT NOT NULL DEFAULT '',
      custom        INTEGER NOT NULL DEFAULT 0,
      active        INTEGER NOT NULL DEFAULT 1,
      justification TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_checks_pillar ON checks(pillar_id);

    -- Editable versions of a check. Each row is a full snapshot of the check's
    -- fields (denormalized) + a per-check version number + optional comment.
    CREATE TABLE IF NOT EXISTS check_iterations (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      check_id      INTEGER NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      version       INTEGER NOT NULL,
      comment       TEXT NOT NULL DEFAULT '',
      pillar        TEXT NOT NULL,
      layer         TEXT NOT NULL,
      name          TEXT NOT NULL,
      plain_english TEXT NOT NULL DEFAULT '',
      feasibility   TEXT NOT NULL,
      effort        TEXT NOT NULL,
      how           TEXT NOT NULL DEFAULT '',
      source        TEXT NOT NULL,
      hero          INTEGER NOT NULL DEFAULT 0,
      phase         TEXT NOT NULL,
      dup_of        TEXT NOT NULL DEFAULT '',
      mvp           TEXT NOT NULL,
      priority      TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(check_id, version)
    );
    CREATE INDEX IF NOT EXISTS idx_iter_check ON check_iterations(check_id);
  `);

  // Idempotent migration: add active/justification to a pre-existing checks table.
  const cols = new Set((d.prepare('PRAGMA table_info(checks)').all() as { name: string }[]).map((c) => c.name));
  if (!cols.has('active')) d.exec("ALTER TABLE checks ADD COLUMN active INTEGER NOT NULL DEFAULT 1");
  if (!cols.has('justification')) d.exec("ALTER TABLE checks ADD COLUMN justification TEXT NOT NULL DEFAULT ''");

  _db = d;
  return d;
}

/** Seed the reference pillars + checks once (no-op if already populated). */
export function ensureSeeded(): void {
  const d = db();
  const { c } = d.prepare('SELECT COUNT(*) AS c FROM checks').get() as { c: number };
  if (c > 0) return;

  const insertPillar = d.prepare('INSERT INTO pillars (name, layer) VALUES (?, ?)');
  const insertCheck = d.prepare(`
    INSERT INTO checks (pillar_id, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, custom)
    VALUES (@pillar_id, @name, @plain_english, @feasibility, @effort, @how, @source, @hero, @phase, @dup_of, @mvp, @priority, 0)
  `);

  d.transaction(() => {
    const pillarId: Record<string, number> = {};
    for (const ch of CHECKS) {
      if (pillarId[ch.pillar] === undefined) {
        const info = insertPillar.run(ch.pillar, layerOf(ch.pillar));
        pillarId[ch.pillar] = Number(info.lastInsertRowid);
      }
    }
    for (const ch of CHECKS) {
      insertCheck.run({
        pillar_id: pillarId[ch.pillar],
        name: ch.check,
        plain_english: ch.plainEnglish,
        feasibility: ch.bucket,
        effort: ch.effort,
        how: ch.how,
        source: ch.source,
        hero: ch.hero ? 1 : 0,
        phase: ch.phase,
        dup_of: ch.dupOf || '',
        mvp: ch.mvp,
        priority: '',
      });
    }
  })();
}

// ---- Row mapping -----------------------------------------------------------
interface DbCheck {
  id: number;
  pillarId: number;
  pillar: string;
  layer: string;
  check_name: string;
  plainEnglish: string;
  bucket: string;
  effort: string;
  how: string;
  source: string;
  hero: number;
  phase: string;
  dupOf: string;
  mvp: string;
  priority: string;
  custom: number;
  active: number;
  justification: string;
}

const SELECT_CHECK = `
  SELECT c.id, c.pillar_id AS pillarId, p.name AS pillar, p.layer AS layer,
         c.name AS check_name, c.plain_english AS plainEnglish, c.feasibility AS bucket,
         c.effort AS effort, c.how AS how, c.source AS source, c.hero AS hero,
         c.phase AS phase, c.dup_of AS dupOf, c.mvp AS mvp, c.priority AS priority, c.custom AS custom,
         c.active AS active, c.justification AS justification
  FROM checks c JOIN pillars p ON p.id = c.pillar_id
`;

function toRow(r: DbCheck): CheckRow {
  return {
    id: r.id,
    pillarId: r.pillarId,
    pillar: r.pillar,
    layer: r.layer as Layer,
    check: r.check_name,
    plainEnglish: r.plainEnglish,
    bucket: r.bucket as CheckRow['bucket'],
    effort: r.effort as CheckRow['effort'],
    how: r.how,
    source: r.source,
    hero: !!r.hero,
    phase: r.phase as CheckRow['phase'],
    dupOf: r.dupOf,
    mvp: r.mvp as CheckRow['mvp'],
    priority: r.priority as CheckRow['priority'],
    custom: !!r.custom,
    active: !!r.active,
    justification: r.justification,
  };
}

// ---- Reads -----------------------------------------------------------------
export function listPillars(): PillarRow[] {
  return db().prepare('SELECT id, name, layer FROM pillars ORDER BY id').all() as PillarRow[];
}

export function listChecks(): CheckRow[] {
  // Group by pillar (pillar_id = first-appearance order), then id within a pillar,
  // so checks appended after the initial seed still sit in their pillar's block.
  return (db().prepare(`${SELECT_CHECK} ORDER BY c.pillar_id, c.id`).all() as DbCheck[]).map(toRow);
}

export function getCheck(id: number): CheckRow | null {
  const r = db().prepare(`${SELECT_CHECK} WHERE c.id = ?`).get(id) as DbCheck | undefined;
  return r ? toRow(r) : null;
}

// ---- Writes ----------------------------------------------------------------
/** Find a pillar by name, or create it with the given layer. Never overrides an
 *  existing pillar's layer (matches the original behavior). */
function resolvePillarId(name: string, layer: string): number {
  const row = db().prepare('SELECT id FROM pillars WHERE name = ?').get(name) as { id: number } | undefined;
  if (row) return row.id;
  return Number(db().prepare('INSERT INTO pillars (name, layer) VALUES (?, ?)').run(name, layer).lastInsertRowid);
}

/** Delete pillars that no longer have any check. */
function pruneOrphanPillars(): void {
  db().prepare('DELETE FROM pillars WHERE id NOT IN (SELECT DISTINCT pillar_id FROM checks)').run();
}

export function createCheck(input: CheckInput, custom = true): CheckRow {
  const id = db().transaction(() => {
    const pid = resolvePillarId(input.pillar, input.layer);
    const info = db()
      .prepare(`
        INSERT INTO checks (pillar_id, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, custom)
        VALUES (@pillar_id, @name, @plain_english, @feasibility, @effort, @how, @source, @hero, @phase, @dup_of, @mvp, @priority, @custom)
      `)
      .run({
        pillar_id: pid,
        name: input.check,
        plain_english: input.plainEnglish,
        feasibility: input.bucket,
        effort: input.effort,
        how: input.how,
        source: input.source,
        hero: input.hero ? 1 : 0,
        phase: input.phase,
        dup_of: input.dupOf,
        mvp: input.mvp,
        priority: input.priority,
        custom: custom ? 1 : 0,
      });
    return Number(info.lastInsertRowid);
  })();
  return getCheck(id)!;
}

export function updateCheck(id: number, input: CheckInput): CheckRow | null {
  const ok = db().transaction(() => {
    const exists = db().prepare('SELECT 1 FROM checks WHERE id = ?').get(id);
    if (!exists) return false;
    const pid = resolvePillarId(input.pillar, input.layer);
    db()
      .prepare(`
        UPDATE checks SET pillar_id=@pillar_id, name=@name, plain_english=@plain_english, feasibility=@feasibility,
          effort=@effort, how=@how, source=@source, hero=@hero, phase=@phase, dup_of=@dup_of, mvp=@mvp, priority=@priority
        WHERE id=@id
      `)
      .run({
        id,
        pillar_id: pid,
        name: input.check,
        plain_english: input.plainEnglish,
        feasibility: input.bucket,
        effort: input.effort,
        how: input.how,
        source: input.source,
        hero: input.hero ? 1 : 0,
        phase: input.phase,
        dup_of: input.dupOf,
        mvp: input.mvp,
        priority: input.priority,
      });
    pruneOrphanPillars();
    return true;
  })();
  return ok ? getCheck(id) : null;
}

/** Update review-workflow metadata (active flag / justification) on any check,
 *  including read-only base checks. */
export function updateCheckMeta(id: number, patch: { active?: boolean; justification?: string }): CheckRow | null {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.active !== undefined) {
    sets.push('active = @active');
    params.active = patch.active ? 1 : 0;
  }
  if (patch.justification !== undefined) {
    sets.push('justification = @justification');
    params.justification = patch.justification;
  }
  if (sets.length === 0) return getCheck(id);
  const info = db().prepare(`UPDATE checks SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return info.changes > 0 ? getCheck(id) : null;
}

export function deleteCheck(id: number): boolean {
  return db().transaction(() => {
    const info = db().prepare('DELETE FROM checks WHERE id = ?').run(id);
    pruneOrphanPillars();
    return info.changes > 0;
  })();
}

// ---- Iterations (versions) -------------------------------------------------
interface DbIteration {
  id: number;
  checkId: number;
  version: number;
  comment: string;
  pillar: string;
  layer: string;
  check_name: string;
  plainEnglish: string;
  bucket: string;
  effort: string;
  how: string;
  source: string;
  hero: number;
  phase: string;
  dupOf: string;
  mvp: string;
  priority: string;
  createdAt: string;
}

const SELECT_ITER = `
  SELECT id, check_id AS checkId, version, comment, pillar, layer, name AS check_name,
         plain_english AS plainEnglish, feasibility AS bucket, effort AS effort, how AS how,
         source AS source, hero AS hero, phase AS phase, dup_of AS dupOf, mvp AS mvp,
         priority AS priority, created_at AS createdAt
  FROM check_iterations
`;

function toIter(r: DbIteration): IterationRow {
  return {
    id: r.id,
    checkId: r.checkId,
    version: r.version,
    comment: r.comment,
    pillar: r.pillar,
    layer: r.layer as Layer,
    check: r.check_name,
    plainEnglish: r.plainEnglish,
    bucket: r.bucket as IterationRow['bucket'],
    effort: r.effort as IterationRow['effort'],
    how: r.how,
    source: r.source,
    hero: !!r.hero,
    phase: r.phase as IterationRow['phase'],
    dupOf: r.dupOf,
    mvp: r.mvp as IterationRow['mvp'],
    priority: r.priority as IterationRow['priority'],
    createdAt: r.createdAt,
  };
}

export function listIterations(): IterationRow[] {
  return (db().prepare(`${SELECT_ITER} ORDER BY check_id, version`).all() as DbIteration[]).map(toIter);
}

export function getIteration(id: number): IterationRow | null {
  const r = db().prepare(`${SELECT_ITER} WHERE id = ?`).get(id) as DbIteration | undefined;
  return r ? toIter(r) : null;
}

function iterParams(input: IterationInput) {
  return {
    comment: input.comment,
    pillar: input.pillar,
    layer: input.layer,
    name: input.check,
    plain_english: input.plainEnglish,
    feasibility: input.bucket,
    effort: input.effort,
    how: input.how,
    source: input.source,
    hero: input.hero ? 1 : 0,
    phase: input.phase,
    dup_of: input.dupOf,
    mvp: input.mvp,
    priority: input.priority,
  };
}

/** Create the next version for a check (v = max+1). Returns null if the check is gone. */
export function createIteration(checkId: number, input: IterationInput): IterationRow | null {
  const id = db().transaction(() => {
    const exists = db().prepare('SELECT 1 FROM checks WHERE id = ?').get(checkId);
    if (!exists) return null;
    const { next } = db()
      .prepare('SELECT COALESCE(MAX(version), 0) + 1 AS next FROM check_iterations WHERE check_id = ?')
      .get(checkId) as { next: number };
    const info = db()
      .prepare(`
        INSERT INTO check_iterations (check_id, version, comment, pillar, layer, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority)
        VALUES (@check_id, @version, @comment, @pillar, @layer, @name, @plain_english, @feasibility, @effort, @how, @source, @hero, @phase, @dup_of, @mvp, @priority)
      `)
      .run({ check_id: checkId, version: next, ...iterParams(input) });
    return Number(info.lastInsertRowid);
  })();
  return id == null ? null : getIteration(id);
}

/** Update a version's snapshot fields + comment (version number is immutable). */
export function updateIteration(id: number, input: IterationInput): IterationRow | null {
  const ok = db()
    .prepare(`
      UPDATE check_iterations SET comment=@comment, pillar=@pillar, layer=@layer, name=@name,
        plain_english=@plain_english, feasibility=@feasibility, effort=@effort, how=@how, source=@source,
        hero=@hero, phase=@phase, dup_of=@dup_of, mvp=@mvp, priority=@priority
      WHERE id=@id
    `)
    .run({ id, ...iterParams(input) });
  return ok.changes > 0 ? getIteration(id) : null;
}

export function deleteIteration(id: number): boolean {
  return db().prepare('DELETE FROM check_iterations WHERE id = ?').run(id).changes > 0;
}
