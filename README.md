# Feasibility App — Per-check Appendix (React port)

Standalone Next.js + TypeScript + Tailwind port of the **Per-check appendix** from
`../spectera-pillar-feasibility-report-v4.html`. Pixel-faithful; the four summary
sections (scope, integration tags, effort-at-a-glance, pillar verdicts) were intentionally
dropped — this app is the interactive checks table only.

Design doc: [`../docs/superpowers/specs/2026-07-17-pillar-feasibility-react-port-design.md`](../docs/superpowers/specs/2026-07-17-pillar-feasibility-react-port-design.md).

## Run

```bash
npm install
npm run dev        # http://localhost:4100
```

Other scripts: `npm run build` · `npm run start` · `npm test` (vitest) · `npm run lint`.

## Layout

- `data/` — **generated** typed data (`checks.ts` = 200 built-in rows, `taxonomy-data.ts`).
  Regenerate from the source HTML with `npm run extract-data` (runs `scripts/extract-data.mjs`).
- `types.ts` — domain types (`Check`, `Filters`, `ChangesBundle`, …).
- `lib/` — pure logic + the persistence seam:
  - `filters.ts` — filter/sort (unit-tested)
  - `exports.ts` — CSV + changes-bundle (byte-compatible with the original HTML tool)
  - `report-state.ts` — **the backend seam**: all persistence goes through `useReportState`
    (localStorage today; swap this one file to add a backend)
  - `taxonomy.ts`, `theme.ts`
- `components/` — `Toolbar`, `ChecksTable`, `PriorityCell`, `MvpCell`, `MetricModal`, `ThemeToggle`.
- `app/` — `layout.tsx` (no-flash theme script), `page.tsx`, `globals.css` (ported design tokens).

## Data model (SQLite via better-sqlite3)

Three relational tables in `${DATA_DIR:-.data}/feasibility.db` (WAL mode), all in
[`lib/server/db.ts`](lib/server/db.ts):

- **`pillars`** `(id, name UNIQUE, layer)` — the 29 pillars.
- **`checks`** `(id, pillar_id → pillars, name, plain_english, feasibility, effort, how, source,
  hero, phase, dup_of, mvp, priority, custom)` — the **217** reference checks (v4's re-verified 200
  plus the 17 that v4 removed, restored from the v3 report), seeded once with sequential ids.
  **Base check fields are read-only** (no PUT on `/api/checks`). Listed ordered by pillar then id.
- **`check_iterations`** `(id, check_id → checks, version, comment, …all check fields…, created_at)`
  — editable **versions** of a check. `version` is per-check (v1, v2, …); each row is a full
  denormalized snapshot; `comment` is an optional commit-message.

The reference data is seeded on the first `GET /api/data` (no-op afterwards). `DATA_DIR` overrides
where the DB file is written.

### API routes

| Route | Verbs | Purpose |
|---|---|---|
| `/api/data` | GET | full snapshot: `{ pillars, checks, iterations }` (seeds on first hit) |
| `/api/checks` | POST | add a new custom base check |
| `/api/checks/[id]` | DELETE | delete a custom check (cascades its versions) |
| `/api/iterations` | POST | create the next version for a check (`{ checkId, …fields, comment }`) |
| `/api/iterations/[id]` | PUT, DELETE | edit / delete a version |

`lib/report-state.ts` (`useReportState`) loads the snapshot on mount and refetches after each
mutation, so pillars, version numbers, and ids stay authoritative. This is shared state — everyone
hitting the app sees the same data. Theme remains a per-browser `localStorage` preference.

### Versioning UX

Base rows are read-only. Each row has a **version dropdown** (Base · v1 · v2 …) and **＋ Version**,
which duplicates the latest version (or base) into an editable form + optional comment; **Save**
creates it. Selecting a version shows its values and lets you **Edit**/**Delete** it.

## Adding more features later

The seam is `lib/report-state.ts` + `lib/server/db.ts`. Multi-user attribution, auth, or richer
queries slot into these two files without touching the component layer.
