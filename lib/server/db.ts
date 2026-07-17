// Server-only Postgres persistence (node-postgres / Neon). Import ONLY from
// route handlers / server code — never from a client component.
//
// Relational model:
//   pillars(id, name UNIQUE)
//   checks(id, pillar_id -> pillars.id, …fields…, custom, active, justification)
//   check_iterations(id, check_id -> checks.id, version, comment, …snapshot…)
import { Pool, type PoolClient } from 'pg';
import type { CheckInput, CheckRow, IterationInput, IterationRow, PillarRow } from '@/types';
import { CHECKS } from '@/data/checks';

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
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(check_id, version)
  );
  CREATE INDEX IF NOT EXISTS idx_iter_check ON check_iterations(check_id);
  -- migration: drop the retired "layer" column from any pre-existing DB
  ALTER TABLE pillars DROP COLUMN IF EXISTS layer;
  ALTER TABLE check_iterations DROP COLUMN IF EXISTS layer;
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
    const cols = 13;
    const cTuples = CHECKS.map(
      (_, i) => '(' + Array.from({ length: cols }, (_, j) => `$${i * cols + j + 1}`).join(',') + ')',
    ).join(',');
    const cVals: unknown[] = [];
    for (const ch of CHECKS) {
      cVals.push(pillarId[ch.pillar], ch.check, ch.plainEnglish, ch.bucket, ch.effort, ch.how, ch.source, ch.hero, ch.phase, ch.dupOf || '', ch.mvp, '', false);
    }
    await client.query(
      `INSERT INTO checks (pillar_id, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, custom)
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

// ---- Row mapping -----------------------------------------------------------
interface DbCheckRow {
  id: number; pillarId: number; pillar: string; checkName: string;
  plainEnglish: string; bucket: string; effort: string; how: string; source: string;
  hero: boolean; phase: string; dupOf: string; mvp: string; priority: string;
  custom: boolean; active: boolean; justification: string;
}
interface DbIterRow {
  id: number; checkId: number; version: number; comment: string; pillar: string;
  checkName: string; plainEnglish: string; bucket: string; effort: string; how: string;
  source: string; hero: boolean; phase: string; dupOf: string; mvp: string; priority: string; createdAt: string;
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
    createdAt: r.createdAt,
  };
}

const SELECT_CHECK = `
  SELECT c.id, c.pillar_id AS "pillarId", p.name AS pillar,
         c.name AS "checkName", c.plain_english AS "plainEnglish", c.feasibility AS bucket,
         c.effort, c.how, c.source, c.hero, c.phase, c.dup_of AS "dupOf", c.mvp, c.priority,
         c.custom, c.active, c.justification
  FROM checks c JOIN pillars p ON p.id = c.pillar_id
`;
const SELECT_ITER = `
  SELECT id, check_id AS "checkId", version, comment, pillar, name AS "checkName",
         plain_english AS "plainEnglish", feasibility AS bucket, effort, how, source, hero, phase,
         dup_of AS "dupOf", mvp, priority, created_at::text AS "createdAt"
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
      `INSERT INTO checks (pillar_id, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority, custom)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [pid, input.check, input.plainEnglish, input.bucket, input.effort, input.how, input.source, input.hero, input.phase, input.dupOf, input.mvp, input.priority, custom],
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
    input.effort, input.how, input.source, input.hero, input.phase, input.dupOf, input.mvp, input.priority,
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
        `INSERT INTO check_iterations (check_id, version, comment, pillar, name, plain_english, feasibility, effort, how, source, hero, phase, dup_of, mvp, priority)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
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
       effort=$6, how=$7, source=$8, hero=$9, phase=$10, dup_of=$11, mvp=$12, priority=$13
     WHERE id=$14`,
    [...iterValues(input), id],
  );
  return r.rowCount ? getIteration(id) : null;
}

export async function deleteIteration(id: number): Promise<boolean> {
  await ensureSchema();
  const r = await pool.query('DELETE FROM check_iterations WHERE id = $1', [id]);
  return (r.rowCount ?? 0) > 0;
}
