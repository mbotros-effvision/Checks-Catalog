// Server-only Postgres persistence (node-postgres / Neon). Import ONLY from
// route handlers / server code — never from a client component.
//
// Relational model:
//   pillars(id, name UNIQUE)
//   checks(id, pillar_id -> pillars.id, …fields…, custom, active, justification)
//   check_iterations(id, check_id -> checks.id, version, comment, …snapshot…)
import { Pool, type PoolClient } from 'pg';
import type { CheckInput, CheckRow, IterationInput, IterationRow, MamtaRow, PillarRow } from '@/types';
import { CHECKS } from '@/data/checks';
import { MAMTA_CHECKS } from '@/data/mamta-checks';

// Reuse a single pool across dev hot-reloads to avoid exhausting connections.
const g = globalThis as unknown as { _pgPool?: Pool };
const pool =
  g._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
if (process.env.NODE_ENV !== 'production') g._pgPool = pool;

const SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS pillars (
    id   SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );
  CREATE TABLE IF NOT EXISTS checks (
    id            SERIAL PRIMARY KEY,
    pillar_id     INTEGER NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    plain_english TEXT NOT NULL DEFAULT '',
    feasibility   TEXT NOT NULL,
    effort        TEXT NOT NULL,
    how           TEXT NOT NULL DEFAULT '',
    source        TEXT NOT NULL,
    hero          BOOLEAN NOT NULL DEFAULT false,
    phase         TEXT NOT NULL,
    dup_of        TEXT NOT NULL DEFAULT '',
    mvp           TEXT NOT NULL,
    priority      TEXT NOT NULL DEFAULT '',
    roadmap       TEXT NOT NULL DEFAULT '',
    custom        BOOLEAN NOT NULL DEFAULT false,
    active        BOOLEAN NOT NULL DEFAULT true,
    justification TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_checks_pillar ON checks(pillar_id);
  CREATE TABLE IF NOT EXISTS check_iterations (
    id            SERIAL PRIMARY KEY,
    check_id      INTEGER NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    version       INTEGER NOT NULL,
    comment       TEXT NOT NULL DEFAULT '',
    pillar        TEXT NOT NULL,
    name          TEXT NOT NULL,
    plain_english TEXT NOT NULL DEFAULT '',
    feasibility   TEXT NOT NULL,
    effort        TEXT NOT NULL,
    how           TEXT NOT NULL DEFAULT '',
    source        TEXT NOT NULL,
    hero          BOOLEAN NOT NULL DEFAULT false,
    phase         TEXT NOT NULL,
    dup_of        TEXT NOT NULL DEFAULT '',
    mvp           TEXT NOT NULL,
    priority      TEXT NOT NULL DEFAULT '',
    roadmap       TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(check_id, version)
  );
  CREATE INDEX IF NOT EXISTS idx_iter_check ON check_iterations(check_id);
  -- Mamta QA checklist: read-only reference rows imported from the QA workbook.
  -- The check text lives in "name" (CHECK is reserved, and it matches the
  -- checks/check_iterations convention); "sort_order" is the seed array index.
  CREATE TABLE IF NOT EXISTS mamta_checks (
    id         TEXT PRIMARY KEY,
    version    TEXT NOT NULL,
    category   TEXT NOT NULL,
    section    TEXT NOT NULL DEFAULT '',
    number     INTEGER NOT NULL,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL DEFAULT '',
    steps      TEXT NOT NULL DEFAULT '',
    expected   TEXT NOT NULL DEFAULT '',
    priority   TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_mamta_sort ON mamta_checks(sort_order);
  -- migration: drop the retired "layer" column from any pre-existing DB
  ALTER TABLE pillars DROP COLUMN IF EXISTS layer;
  ALTER TABLE check_iterations DROP COLUMN IF EXISTS layer;
  -- migration: add the "roadmap" text field to any pre-existing DB
  ALTER TABLE checks ADD COLUMN IF NOT EXISTS roadmap TEXT NOT NULL DEFAULT '';
  ALTER TABLE check_iterations ADD COLUMN IF NOT EXISTS roadmap TEXT NOT NULL DEFAULT '';
`;

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) schemaReady = pool.query(SCHEMA_DDL).then(() => undefined);
  return schemaReady;
}

// ---- Seed (batched: 2 inserts, not 200 round-trips) ------------------------
export async function ensureSeeded(): Promise<void> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [727100]); // serialize seeding
    const { rows } = await client.query('SELECT COUNT(*)::int AS c FROM checks');
    if (rows[0].c > 0) {
      await client.query('COMMIT');
      return;
    }

    // 1) pillars in first-appearance order -> name→id map
    const pillarNames: string[] = [];
    for (const ch of CHECKS) if (!pillarNames.includes(ch.pillar)) pillarNames.push(ch.pillar);
    const pTuples = pillarNames.map((_, i) => `($${i + 1})`).join(',');
    const pRes = await client.query(`INSERT INTO pillars (name) VALUES ${pTuples} RETURNING id, name`, pillarNames);
    const pillarId: Record<string, number> = {};
    for (const r of pRes.rows) pillarId[r.name] = r.id;

    // 2) checks in array order (pillar-contiguous) -> sequential ids
    const cols = 14;
    const cTuples = CHECKS.map(
      (_, i) => '(' + Array.from({ length: cols }, (_, j) => `$${i * cols + j + 1}`).join(',') + ')',
    ).join(',');
    const cVals: unknown[] = [];
    for (const ch of CHECKS) {
      cVals.push(pillarId[ch.pillar], ch.check, ch.plainEnglish, ch.bucket, ch.effort, ch.how, ch.source, ch.hero, ch.phase, ch.dupOf || '', ch.mvp, '', ch.roadmap, false);
    }
    await client.query(
      `INSERT INTO checks (pillar_id, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, roadmap, custom)
       VALUES ${cTuples}`,
      cVals,
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ---- Roadmap backfill ------------------------------------------------------
// ensureSeeded() early-returns once `checks` has rows, so a database seeded
// before the roadmap field was populated never picks it up from the seed.
// Upsert-always, like the Mamta seed: base rows are read-only in the app, so
// rewriting the roadmap column clobbers nothing user-authored (iteration rows
// are untouched). Memoized, so this costs one statement per server process.
let roadmapReady: Promise<void> | null = null;

export function ensureRoadmapBackfilled(): Promise<void> {
  if (!roadmapReady) {
    roadmapReady = backfillRoadmap().catch((e) => {
      roadmapReady = null; // let the next request retry a transient failure
      throw e;
    });
  }
  return roadmapReady;
}

async function backfillRoadmap(): Promise<void> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [727102]); // distinct from the other seeds
    const cols = 3;
    const tuples = CHECKS.map(
      (_, i) => '(' + Array.from({ length: cols }, (_, j) => `$${i * cols + j + 1}`).join(',') + ')',
    ).join(',');
    const vals: unknown[] = [];
    for (const ch of CHECKS) vals.push(ch.pillar, ch.check, ch.roadmap);
    await client.query(
      `UPDATE checks c SET roadmap = v.roadmap
       FROM (VALUES ${tuples}) AS v(pillar, name, roadmap)
       JOIN pillars p ON p.name = v.pillar
       WHERE c.pillar_id = p.id AND c.name = v.name
         AND c.custom = false AND c.roadmap IS DISTINCT FROM v.roadmap`,
      vals,
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ---- Mamta seed ------------------------------------------------------------
// Deliberately NOT folded into ensureSeeded(): that one early-returns as soon
// as `checks` has rows, so on any already-seeded database this would never run.
let mamtaReady: Promise<void> | null = null;

export function ensureMamtaSeeded(): Promise<void> {
  if (!mamtaReady) {
    mamtaReady = seedMamta().catch((e) => {
      mamtaReady = null; // let the next request retry a transient failure
      throw e;
    });
  }
  return mamtaReady;
}

/** Upsert-always rather than a COUNT(*) guard: these rows carry no user state,
 *  so rewriting them clobbers nothing, and a guard would go stale the moment a
 *  typo is fixed in data/mamta-checks.ts. Memoized above, so this costs one
 *  statement per server process. */
async function seedMamta(): Promise<void> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [727101]); // distinct from the checks seed
    const cols = 11;
    const tuples = MAMTA_CHECKS.map(
      (_, i) => '(' + Array.from({ length: cols }, (_, j) => `$${i * cols + j + 1}`).join(',') + ')',
    ).join(',');
    const vals: unknown[] = [];
    MAMTA_CHECKS.forEach((m, i) => {
      vals.push(m.id, m.version, m.category, m.section, m.number, m.check, m.url, m.steps, m.expected, m.priority, i);
    });
    await client.query(
      `INSERT INTO mamta_checks (id, version, category, section, number, name, url, steps, expected, priority, sort_order)
       VALUES ${tuples}
       ON CONFLICT (id) DO UPDATE SET
         version = EXCLUDED.version, category = EXCLUDED.category, section = EXCLUDED.section,
         number = EXCLUDED.number, name = EXCLUDED.name, url = EXCLUDED.url, steps = EXCLUDED.steps,
         expected = EXCLUDED.expected, priority = EXCLUDED.priority, sort_order = EXCLUDED.sort_order`,
      vals,
    );
    // drop rows removed from the seed file
    await client.query('DELETE FROM mamta_checks WHERE id <> ALL($1::text[])', [MAMTA_CHECKS.map((m) => m.id)]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ---- Row mapping -----------------------------------------------------------
interface DbCheckRow {
  id: number; pillarId: number; pillar: string; checkName: string;
  plainEnglish: string; bucket: string; effort: string; how: string; source: string;
  hero: boolean; phase: string; dupOf: string; mvp: string; priority: string; roadmap: string;
  custom: boolean; active: boolean; justification: string;
}
interface DbIterRow {
  id: number; checkId: number; version: number; comment: string; pillar: string;
  checkName: string; plainEnglish: string; bucket: string; effort: string; how: string;
  source: string; hero: boolean; phase: string; dupOf: string; mvp: string; priority: string;
  roadmap: string; createdAt: string;
}

function toRow(r: DbCheckRow): CheckRow {
  return {
    id: r.id,
    pillarId: r.pillarId,
    pillar: r.pillar,
    check: r.checkName,
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
    roadmap: r.roadmap,
    custom: !!r.custom,
    active: !!r.active,
    justification: r.justification,
  };
}

function toIter(r: DbIterRow): IterationRow {
  return {
    id: r.id,
    checkId: r.checkId,
    version: r.version,
    comment: r.comment,
    pillar: r.pillar,
    check: r.checkName,
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
    roadmap: r.roadmap,
    createdAt: r.createdAt,
  };
}

interface DbMamtaRow {
  id: string; seq: number; version: string; category: string; section: string; number: number;
  checkName: string; url: string; steps: string; expected: string; priority: string;
}

function toMamtaRow(r: DbMamtaRow): MamtaRow {
  return {
    id: r.id,
    seq: r.seq,
    version: r.version as MamtaRow['version'],
    category: r.category,
    section: r.section,
    number: r.number,
    check: r.checkName,
    url: r.url,
    steps: r.steps,
    expected: r.expected,
    priority: r.priority as MamtaRow['priority'],
  };
}

const SELECT_CHECK = `
  SELECT c.id, c.pillar_id AS "pillarId", p.name AS pillar,
         c.name AS "checkName", c.plain_english AS "plainEnglish", c.feasibility AS bucket,
         c.effort, c.how, c.source, c.hero, c.phase, c.dup_of AS "dupOf", c.mvp, c.priority,
         c.roadmap, c.custom, c.active, c.justification
  FROM checks c JOIN pillars p ON p.id = c.pillar_id
`;
const SELECT_ITER = `
  SELECT id, check_id AS "checkId", version, comment, pillar, name AS "checkName",
         plain_english AS "plainEnglish", feasibility AS bucket, effort, how, source, hero, phase,
         dup_of AS "dupOf", mvp, priority, roadmap, created_at::text AS "createdAt"
  FROM check_iterations
`;

// ---- Reads -----------------------------------------------------------------
export async function listPillars(): Promise<PillarRow[]> {
  await ensureSchema();
  const { rows } = await pool.query('SELECT id, name FROM pillars ORDER BY id');
  return rows as PillarRow[];
}

export async function listChecks(): Promise<CheckRow[]> {
  await ensureSchema();
  const { rows } = await pool.query(`${SELECT_CHECK} ORDER BY c.pillar_id, c.id`);
  return rows.map(toRow);
}

export async function getCheck(id: number): Promise<CheckRow | null> {
  await ensureSchema();
  const { rows } = await pool.query(`${SELECT_CHECK} WHERE c.id = $1`, [id]);
  return rows[0] ? toRow(rows[0]) : null;
}

export async function listIterations(): Promise<IterationRow[]> {
  await ensureSchema();
  const { rows } = await pool.query(`${SELECT_ITER} ORDER BY check_id, version`);
  return rows.map(toIter);
}

export async function getIteration(id: number): Promise<IterationRow | null> {
  await ensureSchema();
  const { rows } = await pool.query(`${SELECT_ITER} WHERE id = $1`, [id]);
  return rows[0] ? toIter(rows[0]) : null;
}

/** Workbook order — sort_order is the seed array index, which keeps each tab's
 *  section groups contiguous for the grouped table render. `seq` is derived
 *  from it rather than stored, so the running number can never drift out of
 *  step with the ordering it describes. */
export async function listMamtaChecks(): Promise<MamtaRow[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, sort_order + 1 AS seq, version, category, section, number,
            name AS "checkName", url, steps, expected, priority
     FROM mamta_checks ORDER BY sort_order`,
  );
  return rows.map(toMamtaRow);
}

// ---- Writes ----------------------------------------------------------------
async function resolvePillarId(client: PoolClient, name: string): Promise<number> {
  const found = await client.query('SELECT id FROM pillars WHERE name = $1', [name]);
  if (found.rows[0]) return found.rows[0].id;
  const ins = await client.query(
    'INSERT INTO pillars (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
    [name],
  );
  return ins.rows[0].id;
}

async function pruneOrphanPillars(client: PoolClient): Promise<void> {
  await client.query('DELETE FROM pillars WHERE id NOT IN (SELECT DISTINCT pillar_id FROM checks)');
}

export async function createCheck(input: CheckInput, custom = true): Promise<CheckRow> {
  await ensureSchema();
  const client = await pool.connect();
  let id: number;
  try {
    await client.query('BEGIN');
    const pid = await resolvePillarId(client, input.pillar);
    const r = await client.query(
      `INSERT INTO checks (pillar_id, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, roadmap, custom)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [pid, input.check, input.plainEnglish, input.bucket, input.effort, input.how, input.source, input.hero, input.phase, input.dupOf, input.mvp, input.priority, input.roadmap, custom],
    );
    id = r.rows[0].id;
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return (await getCheck(id))!;
}

/** Update review-workflow metadata (active / justification) on any check. */
export async function updateCheckMeta(
  id: number,
  patch: { active?: boolean; justification?: string },
): Promise<CheckRow | null> {
  await ensureSchema();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.active !== undefined) {
    vals.push(patch.active);
    sets.push(`active = $${vals.length}`);
  }
  if (patch.justification !== undefined) {
    vals.push(patch.justification);
    sets.push(`justification = $${vals.length}`);
  }
  if (sets.length === 0) return getCheck(id);
  vals.push(id);
  const r = await pool.query(`UPDATE checks SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
  return r.rowCount ? getCheck(id) : null;
}

export async function deleteCheck(id: number): Promise<boolean> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('DELETE FROM checks WHERE id = $1', [id]);
    await pruneOrphanPillars(client);
    await client.query('COMMIT');
    return (r.rowCount ?? 0) > 0;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ---- Iterations (versions) -------------------------------------------------
function iterValues(input: IterationInput): unknown[] {
  return [
    input.comment, input.pillar, input.check, input.plainEnglish, input.bucket,
    input.effort, input.how, input.source, input.hero, input.phase, input.dupOf, input.mvp, input.priority, input.roadmap,
  ];
}

export async function createIteration(checkId: number, input: IterationInput): Promise<IterationRow | null> {
  await ensureSchema();
  const client = await pool.connect();
  let id: number | null = null;
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM checks WHERE id = $1', [checkId]);
    if (exists.rowCount) {
      const nx = await client.query(
        'SELECT COALESCE(MAX(version), 0) + 1 AS next FROM check_iterations WHERE check_id = $1',
        [checkId],
      );
      const version = nx.rows[0].next;
      const r = await client.query(
        `INSERT INTO check_iterations (check_id, version, comment, pillar, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, roadmap)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
        [checkId, version, ...iterValues(input)],
      );
      id = r.rows[0].id;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return id == null ? null : getIteration(id);
}

export async function updateIteration(id: number, input: IterationInput): Promise<IterationRow | null> {
  await ensureSchema();
  const r = await pool.query(
    `UPDATE check_iterations SET comment=$1, pillar=$2, name=$3, plain_english=$4, feasibility=$5,
       effort=$6, how=$7, source=$8, hero=$9, phase=$10, dup_of=$11, mvp=$12, priority=$13, roadmap=$14
     WHERE id=$15`,
    [...iterValues(input), id],
  );
  return r.rowCount ? getIteration(id) : null;
}

export async function deleteIteration(id: number): Promise<boolean> {
  await ensureSchema();
  const r = await pool.query('DELETE FROM check_iterations WHERE id = $1', [id]);
  return (r.rowCount ?? 0) > 0;
}
