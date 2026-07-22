// One-off dev tool (NOT shipped in the app bundle).
// Builds the reference check set from the v4 report (the re-verified 200) and
// APPENDS the 17 checks that v4 removed but that still exist in the v3 report
// ("spectera-pillar-feasibility-report 3 (3).html"). v4 values win for any check
// present in both; the 17 v3-only checks are added as base checks. Each check
// then gets a "roadmap" field from spectra-implementation-roadmap.html — the
// phase + item name where it sits on the implementation roadmap.
//
// Run from the feasibility-app/ folder:  node scripts/extract-data.mjs
// Standalone (no deps) so it can run before `npm install`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const V4_HTML = path.resolve(APP_ROOT, '..', 'spectera-pillar-feasibility-report-v4.html');
const V3_HTML = path.resolve(APP_ROOT, '..', 'spectera-pillar-feasibility-report 3 (3).html');
const ROADMAP_HTML = path.resolve(APP_ROOT, '..', 'spectra-implementation-roadmap.html');

function extractP(file) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/var\s+P\s*=\s*(\{[\s\S]*?\});\s*\n\s*var\s+B\s*=\s*P\.buckets/);
  if (!m) {
    console.error('Could not locate the P data object in', file);
    process.exit(1);
  }
  // eslint-disable-next-line no-eval
  return eval('(' + m[1] + ')');
}

/** The roadmap page embeds plain JSON (`var DATA = {…};` right before
 *  `var HOURS`), so indexOf slicing + JSON.parse is enough — no eval. */
function extractRoadmap(file) {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('var DATA = ');
  const end = html.indexOf('var HOURS');
  if (start === -1 || end === -1) {
    console.error('Could not locate the DATA object in', file);
    process.exit(1);
  }
  let json = html.slice(start + 'var DATA = '.length, end).trim();
  if (json.endsWith(';')) json = json.slice(0, -1);
  return JSON.parse(json);
}

const P = extractP(V4_HTML); // v4 — the re-verified base set (values win)
const V3 = extractP(V3_HTML); // v3 — superset that still holds the removed 17
const ROADMAP = extractRoadmap(ROADMAP_HTML); // implementation roadmap (124 items, phases 0-4)

// ---- Tuple field mapping (indices 3-10 are dead legacy slots) --------------
// 0 pillar · 1 check · 2 plainEnglish · 11 mvp · 12 bucket · 13 effort
// 14 how · 15 source · 16 hero · 17 phase · 18 dupOf(optional)
function mapRow(r) {
  const c = {
    pillar: r[0],
    check: r[1],
    plainEnglish: r[2] || '',
    mvp: r[11] || 'Post-MVP',
    bucket: r[12],
    effort: r[13],
    how: r[14] || '',
    source: r[15] || '',
    hero: !!r[16],
    phase: r[17],
  };
  if (r[18]) c.dupOf = r[18];
  return c;
}

const idOf = (r) => r[0] + '||' + r[1];
const v4ids = new Set(P.rows.map(idOf));

const merged = P.rows.map(mapRow); // 200, pillar-contiguous
const extra = V3.rows.filter((r) => !v4ids.has(idOf(r))).map(mapRow); // the 17 removed

// Group everything by pillar (preserving v4 pillar order + within-pillar order,
// v4 checks first then the restored v3-only ones). This keeps each pillar's
// checks contiguous so the seed assigns clean sequential ids 1..N with no gaps.
const pillarOrder = [];
const byPillar = new Map();
for (const c of [...merged, ...extra]) {
  if (!byPillar.has(c.pillar)) {
    byPillar.set(c.pillar, []);
    pillarOrder.push(c.pillar);
  }
  byPillar.get(c.pillar).push(c);
}
const checks = pillarOrder.flatMap((p) => byPillar.get(p));
console.log(`Base v4 checks: ${merged.length}; restored from v3: ${extra.length}; total: ${checks.length}`);

// ---- Roadmap mapping -------------------------------------------------------
// Stamp each check with where it sits on the implementation roadmap:
//   "Phase <n> — <phase name> · <roadmap check name>"  or  "Not in roadmap".
// Match on exact pillar||check first; fall back to check name alone (the
// roadmap regrouped 3 checks under a different pillar — same check text).
const phaseName = Object.fromEntries(ROADMAP.phases.map((p) => [p.n, p.name]));
const roadmapExact = new Map(); // 'pillar||check' -> item
const roadmapByName = new Map(); // lowercased check name -> item
for (const it of ROADMAP.items) {
  roadmapExact.set(it.pillar + '||' + it.check, it);
  roadmapByName.set(it.check.toLowerCase(), it);
}
const matchedRoadmapIds = new Set();
let onRoadmap = 0;
for (const c of checks) {
  const item = roadmapExact.get(c.pillar + '||' + c.check) ?? roadmapByName.get(c.check.toLowerCase());
  if (item) {
    c.roadmap = `Phase ${item.phase} — ${phaseName[item.phase]} · ${item.check}`;
    matchedRoadmapIds.add(item.id);
    onRoadmap++;
  } else {
    c.roadmap = 'Not in roadmap';
  }
}
// Every roadmap item must land on a check — except pure engine builds
// (shared infrastructure rows that are not themselves checks).
const orphaned = ROADMAP.items.filter((it) => !matchedRoadmapIds.has(it.id) && it.engine !== true);
if (orphaned.length) throw new Error(`Roadmap items matching no catalog check: ${orphaned.map((i) => i.id).join(' ; ')}`);
console.log(`Roadmap: ${onRoadmap} checks mapped, ${checks.length - onRoadmap} not in roadmap; ` +
  `${ROADMAP.items.length - matchedRoadmapIds.size} roadmap items unmatched (engine builds)`);

// ---- Sanity checks so a bad extraction fails loudly ------------------------
const BUCKET_KEYS = Object.keys(P.buckets);
const EFFORTS = new Set(['Live', 'Low', 'Medium', 'High', 'N/A']);
const MVPS = new Set(['MVP', 'Post-MVP', 'Duplicated']);
const PHASES = new Set(['A', 'B']);
for (const c of checks) {
  if (!BUCKET_KEYS.includes(c.bucket)) throw new Error(`Unknown bucket "${c.bucket}" on ${c.pillar}||${c.check}`);
  if (!EFFORTS.has(c.effort)) throw new Error(`Unknown effort "${c.effort}" on ${c.pillar}||${c.check}`);
  if (!MVPS.has(c.mvp)) throw new Error(`Unknown mvp "${c.mvp}" on ${c.pillar}||${c.check}`);
  if (!PHASES.has(c.phase)) throw new Error(`Unknown phase "${c.phase}" on ${c.pillar}||${c.check}`);
}

// ---- Emit ------------------------------------------------------------------
const banner = `// AUTO-GENERATED by scripts/extract-data.mjs from
// ../spectera-pillar-feasibility-report-v4.html (200) + the 17 v3-only checks
// from "../spectera-pillar-feasibility-report 3 (3).html", with the "roadmap"
// field merged in from ../spectra-implementation-roadmap.html. Do not edit by
// hand. Re-run \`node scripts/extract-data.mjs\` to regenerate.\n\n`;

const checksTs =
  banner +
  `import type { Check } from '@/types';\n\n` +
  `export const CHECKS: Check[] = ${JSON.stringify(checks, null, 2)};\n`;

const taxonomyTs =
  banner +
  `import type { BucketKey, BucketMeta } from '@/types';\n\n` +
  `export const BUCKET_ORDER: BucketKey[] = ${JSON.stringify(BUCKET_KEYS, null, 2)} as BucketKey[];\n\n` +
  `export const BUCKETS: Record<BucketKey, BucketMeta> = ${JSON.stringify(P.buckets, null, 2)} as Record<BucketKey, BucketMeta>;\n`;

fs.writeFileSync(path.join(APP_ROOT, 'data', 'checks.ts'), checksTs);
fs.writeFileSync(path.join(APP_ROOT, 'data', 'taxonomy-data.ts'), taxonomyTs);

console.log(`Wrote data/checks.ts (${checks.length} checks) and data/taxonomy-data.ts`);
console.log(`Distinct pillars: ${new Set(checks.map((c) => c.pillar)).size}`);
