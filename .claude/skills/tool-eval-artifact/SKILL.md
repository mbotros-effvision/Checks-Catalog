---
name: tool-eval-artifact
description: >-
  Generate a vendor-tool "capability & embedding analysis" artifact for the Snurra Site-Audit product —
  a self-contained interactive HTML page (served from feasibility-app/public/tools/) that assesses one external tool's
  overall functionality and the catalog pillars it touches, the standards it relies on, its integration
  model (URL-in vs code/SDK access, per-check vs summary responses, real API request/response shapes,
  rate-limit / project / run limits, and whether it fits Snurra's adapter model), the catalog checks it
  can 100% cover (mapped verbatim against feasibility-app/data/checks.ts) plus checks it covers that
  aren't in the catalog, and its full pricing — every point backed by a reference. Use this skill whenever
  the user wants such an analysis produced for a named tool — e.g. "do the same for another tool called X",
  "make/create an embedding or capability analysis for X", "evaluate or assess X for Snurra or the site
  audit", "add X to the tool evals", "build the capabilities/pricing/coverage page for X", or "give me the
  tool eval artifact for X" — rather than hand-building the document. Do NOT trigger for adjacent tasks that
  merely mention a tool: answering a factual or docs question about a tool, a single pricing/spec lookup, a
  one-off research sub-question, a quick tool-vs-tool comparison or opinion, editing or re-verifying an
  existing *-analysis.html artifact, or writing the actual integration/adapter code under snurra/. The tell
  is that the user wants the full analysis document created for a tool.
---

# Tool-eval artifact generator

Given a **tool name** (optionally a URL), produce the finished capability & embedding analysis:
`D:\Projects\Effvision\feasibility-app\public\tools\<tool-slug>-analysis.html` (the served location — the app
links it as `/tools/<file>`; the repo-root `*-analysis.html` copies are **legacy, do not write there**). The
whole point is that the user supplies the name and this skill drives research → coverage mapping → writing the
HTML in house style → verifying it.

**Read `references/methodology.md` in full before writing anything.** It holds the mandated content spec,
the 100%-flat-coverage rule (the part that's easy to get wrong), the `checks.ts` schema + parse pattern,
the section-by-section HTML spec, and the gotchas. This SKILL.md is just the workflow around it.

> **NON-NEGOTIABLE — everything needs a solid reference.** Every factual claim in the artifact — each
> capability, pricing figure, rate limit, project/run cap, API endpoint or auth detail, and every standard
> the tool relies on — MUST be backed by a solid source (a URL in the References section, ideally an
> official vendor doc). If a fact can't be sourced, it does not go in as a confident claim: either drop it
> or state it inline as explicitly third-party / unverified. **No unsourced assertions.** This rule is
> repeated throughout because it is the difference between a trustworthy planning doc and a liability.

The house-style **template is `assets/template.html`** (a current, correct example). Copy it and replace
the content — never hand-roll the CSS or section structure.

## Workflow

### 1. Confirm the target, then research (do this first, in the background)
Take the tool name. Launch a research subagent (general-purpose, web-enabled) and, while it runs, start the
coverage survey (step 2). **The research must return a solid source URL (prefer official vendor docs) for
every single fact** — and anything it cannot source it must flag as unverified, so that flag survives all
the way into the artifact rather than being laundered into a confident claim. Gather:

- **Overall functionality** and which catalog **pillars** it plausibly touches.
- **Standards/frameworks** it relies on (OWASP, WCAG 2.0–2.2, PCI-DSS, GDPR/CCPA, IAB TCF, NIST,
  Schema.org + Google Rich Results, Core Web Vitals, BCP-47, …).
- **Integration model** — the section that matters most for Snurra:
  - Input: just a **URL**, or does it need **code/SDK access / a test script inline**?
  - Results: **per-check individual verdicts**, or a **summary** of several checks? Real **API request +
    response** shapes (base URL, auth model, JSON fields).
  - Automation: REST API? webhooks? scheduling? or no API (CLI/desktop/binary)?
  - Limits: **rate limiting**, **number of projects**, **number of runs/scans**, concurrency, usage
    metering — the documented numbers.
  - Snurra fit: sync single-GET / async start-then-poll / webhook / process-runner — does it fit the
    `ProviderAdapter` model (`snurra/worker/src/integrations/`)?
- **Pricing** — every tier/package/subscription, the metering dimension, the free tier, the real cost
  driver.

Prioritise official vendor docs. **Do not fabricate figures** — if pricing or limits aren't public, say so.
Never predict the research agent's results before it returns; wait for it.

### 2. Map coverage against the catalog (the 100% bar)
Parse `feasibility-app/data/checks.ts` (parse pattern in methodology §4). Survey checks in the tool's
domain (by pillar / keyword / `plainEnglish` / `how`), and for each judge against the **100%-certain bar**:
include it **only if the tool can produce that check's verdict on its own, deterministically**. Better to
miss than over-claim. **Drop partial checks.** Produce a **flat list — no additive/redundant/partial
tiering, and no assessment of whether Snurra already covers it.** Use the `bucket` field only as private
judgment input. (Full rule: methodology §3.) **Separately, collect the deterministic checks the tool covers
that have NO match in `checks.ts`** — these populate a distinct "checks not in the catalog" section
(candidate new catalog checks, in `NEWCOV[]`); they are not part of the verbatim COV map.

### 3. Write the HTML
Copy `assets/template.html` → `D:\Projects\Effvision\feasibility-app\public\tools\<tool-slug>-analysis.html`. Adapt every section to the
mandated content (methodology §2, §5): Hero + TL;DR (3 verdict cards, flat coverage count, **plus the
`snurraFit` pill right after the `<h1>`** — set its tier colour/label and `fitNote` per methodology §2.3) → Capabilities
(tabbed; include a standards card) → Embedding paths (fit table + integration-shape callout carrying the
step-1 integration answers) → API/Technical (accordions with a request/response `codeblock`, rate limits,
projects/scale/pricing-metering, webhooks/scheduling) → Ecosystem (`INTS[]`) → Pricing (`table.price`,
flag third-party figures) → **Coverage** (flat `COV[]`, search box only, count "Showing N of N checks
<Tool> can cover", then the **"Additional checks — not in the catalog"** block from `NEWCOV[]`, then the
"does NOT cover" callout) → References (a source per claim) → footer ("Prepared <today>
· for internal planning"). Mind the curly-apostrophe gotcha in `COV[]` notes (methodology §7). **Again: every claim you write must
trace to a reference** — build the References section as you write, one entry per source, and keep every
third-party / unverified flag visible in the prose; never silently promote a shaky figure to a stated fact.

The template is styled to **match the checks-catalog UI** — a warm-paper light theme by default (ink `#1c1a17`,
teal accent `#0f766e`), a charcoal dark theme via the toggle (teal `#2dd4bf`), and the `system-ui` font. Keep
that palette; never reintroduce a different theme (e.g. the old blue/purple one).

### 4. Verify (always)
- `node <this-skill>/scripts/verify_coverage.js feasibility-app/public/tools/<tool-slug>-analysis.html` → must
  print "OK all N coverage names match checks.ts verbatim" with no LEFTOVER TIER markers. Fix any MISSING name to match exactly.
- Open it in the browser pane — via the dev server (`npm run dev` in `feasibility-app`, port 4100 →
  `http://localhost:4100/tools/<tool-slug>-analysis.html`) or
  `file:///D:/Projects/Effvision/feasibility-app/public/tools/<tool-slug>-analysis.html`. Confirm
  `read_console_messages onlyErrors:true` is clean, and via `javascript_tool` that `#covGrid .covitem`
  count == COV length, the count line is correct, `#coverage .chip` == 0 and `#covGrid .ttag` == 0, and the
  search / tabs / accordions / scenario picker / theme toggle work.
- **References completeness (do not skip):** every pricing figure, rate limit, project/run cap, API detail
  and named standard must have a matching entry in the References section, or a visible inline
  third-party/unverified flag. An unsourced claim is a defect — find it and fix it before you finish.

### 5. Update the summary + the card list (ALWAYS — on every add or edit)
**Two files on the Tools-Analysis page must stay in sync with every analysis** — update BOTH in the same pass:
1. **`feasibility-app/app/tools-analysis/toolsData.ts`** — the `TOOLS[]` array rendered natively by
   **`feasibility-app/components/ToolsSummary.tsx`** (the expandable summary; app's own theme, no iframe). This
   is the single source of truth for coverage and must never drift from the analyses.
2. **`feasibility-app/app/tools-analysis/page.tsx`** — the `ANALYSES[]` array (the per-tool link cards at the
   top of the page). Add/replace `{ file:'<slug>-analysis.html', name:'<Tool>', meta:'N catalog · +M net-new' }`
   (each card links to `/tools/<file>`; `meta` = the COV count + NEWCOV count).

Whenever you **create a new analysis _or_ edit an existing one** (coverage, cost, integration, limitations —
anything), update `toolsData.ts` in the same pass:
- Run `node <this-skill>/scripts/summary_entry.js <tool-slug>-analysis.html` — it prints a ready-to-paste
  **TypeScript** `TOOLS[]` entry with the tool's `cov`/`newcov` arrays extracted **verbatim** (and the
  correct counts), so the summary never disagrees with the artifact.
- Fill the prose fields (`snurraFit`, `fitNote`, `ident`, `costShort`, `cost`, `integ`, `lims`) from the
  analysis — `snurraFit` = `api-native | api-with-setup | no-api` and `fitNote` = the hero pill's one-liner
  (methodology §2.3) — then paste the object into the `TOOLS` array in `app/tools-analysis/toolsData.ts` —
  **add** it for a new tool, or **replace** that tool's existing entry when editing. The totals
  (distinct-union / 217, tool→check sum, net-new sum) recompute automatically at render.
- Do not restyle the summary — `ToolsSummary.tsx` uses the app's design tokens and follows the host
  light/dark theme; you only touch the data in `toolsData.ts`.
- (The old standalone `tools-coverage-summary.html` has been **retired** — do not recreate it.)

### 6. Record it
Add or update the artifact's one-line entry in the memory file `feasibility-tool-eval-artifacts.md`
(flat-coverage count + a one-line tool identity).

## Bundled resources
- `references/methodology.md` — mandated content, coverage rule, catalog schema/parse, HTML section spec,
  gotchas. **Read first.**
- `assets/template.html` — the house-style structural/style template to copy from (styled to the checks-catalog UI).
- `scripts/verify_coverage.js` — verbatim name-match + leftover-tier check against `checks.ts`.
- `scripts/summary_entry.js` — emits a ready-to-paste `TOOLS[]` entry (verbatim cov/newcov + counts) for
  keeping `toolsData.ts` in sync on every add/edit.
