# Tool-eval artifact — methodology & content spec

This is the reference for building a **capability & embedding analysis** artifact: a self-contained
interactive HTML page that assesses whether an external vendor tool is worth embedding into the
**Snurra Site-Audit** product. Read this fully before writing an artifact.

## Table of contents
1. What the artifact is (paths, house style)
2. The mandated content — every section that MUST be present
3. The coverage rule (the hard part)
4. The checks catalog — schema, parse pattern, `bucket` field
5. Writing the HTML (section skeleton + the JS data arrays)
6. Verifying
7. Gotchas

---

## 1. What the artifact is

- **Output file:** `D:\Projects\Effvision\<tool-slug>-analysis.html` (repo root). Slug = lowercased tool
  name, hyphenated, e.g. `browserstack-automate-analysis.html`, `observepoint-analysis.html`.
- **Self-contained:** one HTML file, embedded CSS + JS, no external build. Dark theme with a light toggle.
- **Template:** `assets/template.html` in this skill is a current, correctly-styled example
  (ObservePoint). **Copy it, then replace the content section by section** — keep its CSS, its section
  skeleton, and its JS patterns (`INTS[]`, `COV[]`, `RECS{}`, the render/filter functions, theme toggle,
  tabs, accordions, scenario picker). Do not hand-roll new CSS.
- **House style = the checks-catalog UI.** The template's palette matches `feasibility-app`: warm-paper light
  theme by default (`--bg:#fbfaf6`, ink `#1c1a17`, teal accent `#0f766e`), a charcoal dark theme via the
  toggle (`--bg:#131316`, teal `#2dd4bf`), the `system-ui` font and warm radial-gradient background. Keep
  these tokens; never reintroduce a different theme.
- **Audience/tone:** an internal planning doc. Honest, conservative, "prepared for internal planning,
  verify figures." Not vendor marketing.

## 2. The mandated content — every section MUST cover these

The user requires all of the following. **EVERYTHING MUST HAVE A SOLID REFERENCE.** Every factual claim —
each capability, pricing figure, rate limit, project/run cap, API endpoint/auth detail, and every standard
the tool relies on — needs a **solid source** (a URL in the References section, ideally an official vendor
doc). If you cannot source a fact, do not state it as fact: drop it, or flag it inline as third-party /
unverified. This is the single most important quality bar of the artifact — treat an unsourced claim as a
defect, not a stylistic choice.

1. **Overall functionality + which catalog pillars it touches.** Check this FIRST. What does the tool
   fundamentally do, and which of the catalog's pillars (Homepage, Navigation, Content, Security,
   Performance & SEO, Accessibility, Forms & CTAs, Geo Detection, Analytics & Tag Integrity,
   Third-Party Script Health, GDPR Compliance, …) does it plausibly touch. This frames everything.

2. **Standards / frameworks the tool relies on.** Name the formal standards it implements or tests
   against — e.g. OWASP Top 10 / API Top 10, WCAG 2.0/2.1/2.2 (A/AA/AAA), PCI-DSS, HIPAA, NIST,
   GDPR / CCPA / CPRA, IAB TCF, Schema.org + Google Rich Results, Core Web Vitals, BCP-47. Reference each.

3. **Integration ability & model — the most important section for Snurra.** Answer explicitly:
   - **Input model:** does it just take a **URL** and return results, or does it need **access to the
     code / a test script / an SDK inline** (e.g. Percy needs `@percy/playwright` in the render;
     Screaming Frog is a binary you run)?
   - **Result shape:** does it return the verdict of **each check individually**, or a **summary** /
     rolled-up response for a batch of checks? What does a real **API request and response** look like
     (show the shapes — auth, endpoint, JSON fields)?
   - **Automation surface:** REST API? auth model? webhooks? scheduling? Or no API at all (CLI/desktop)?
   - **Limits:** **rate limiting**, **number of projects**, **number of runs / scans**, concurrency,
     volume/usage metering. State the documented numbers.
   - **Snurra fit:** does it technically fit Snurra's adapter model
     (`snurra/worker/src/integrations/`, a `ProviderAdapter` with `buildRequest`/`mapResponse` over
     shared HTTP, PageSpeed = reference)? Sync single-GET, async start-then-poll, webhook, or
     process-runner? Call it out honestly.
   - **`snurraFit` classification (REQUIRED).** Distil the above into a single 3-tier verdict — "can I
     integrate this through an API, and how?" — plus a one-line `fitNote` giving the catch. This drives a
     hero pill in the artifact (§5.1) and the `snurraFit`/`fitNote` fields in the summary entry (§6.5). The
     three values (keep integration *shape* here, not cost — pricing lives in §7):
     - **`api-native`** — URL/domain-in HTTP API you can POST a target to and get results; drop-in
       `ProviderAdapter` (sync or async poll). *e.g. ImmuniWeb, SEMrush.* Colour `#0f766e`, label "API-native".
     - **`api-with-setup`** — an API exists, but it needs a **pre-provisioned target** (an audit/domain you
       configure first, referenced by ID) **or your own test code/SDK** before it returns anything. *e.g.
       ObservePoint, Cookiebot, BrowserStack, Percy.* Colour `#b45309`, label "API + setup".
     - **`no-api`** — no HTTP endpoint to drive on demand; you run a binary / desktop / CLI and parse files
       (push-only webhooks or a forthcoming MCP still count as `no-api`). *e.g. Screaming Frog, Sitebulb.*
       Colour `#b91c1c`, label "No API".
     `fitNote` is one sentence naming the specific blocker (e.g. "reads only domains you own + onboarded — not
     an arbitrary URL"). Use the SAME sentence for the hero pill and the summary `fitNote`.
   - Any other integration-critical detail (real browser vs headless, real devices, geolocation,
     staging/local access, screenshots, graceful degradation).

4. **All checks it can cover — the tool's own capability surface.** The full set of things the tool can
   deterministically verdict, described in its own terms (this is the Capabilities + coverage narrative).

5. **All catalog checks it can cover.** The verbatim mapping against `feasibility-app/data/checks.ts`,
   held to the 100% bar — see §3. This is the `COV[]` list.

6. **Checks it can cover that are NOT in the catalog.** A distinct section listing deterministic checks the
   tool genuinely covers that have **no matching entry in `checks.ts`** — i.e. net-new coverage the catalog
   doesn't yet represent, and therefore candidate *new* checks to add. Each entry needs the tool capability
   and a **reference**. Keep it separate from the verbatim catalog map (§5): these are new check names, not
   catalog names, so they must never be verified against `checks.ts`.

7. **Pricing.** Every package / tier / subscription and the pricing *dimension* (per user, per parallel,
   per screenshot, per page-scan, per target, quote-only…). Mark any figure that is third-party or
   unverified. Include the free tier and the real cost driver.

8. **References — a solid source for every single point above.** This is non-negotiable and worth repeating:
   **no claim ships without a reference.** Prioritise official vendor docs; give each reference a short note
   on what it backs. Any figure that is third-party, estimated, or unverifiable must be *labelled as such*
   both at the reference and inline where it appears — never presented as a confirmed fact. A pricing
   number, a rate limit, a project cap, an API detail, or a named standard with no source is a bug.

## 3. The coverage rule (held to a 100%-certain bar)

This is the rule the user cares about most. Get it wrong and the whole artifact is untrustworthy.

- **Include a catalog check ONLY IF you are 100% certain the tool can produce that check's verdict on its
  own, deterministically** — no human judgment, no AI-text judgment, no "extracts part of the signal".
  **It is better to miss a coverable check than to over-claim one it can't fully do.**
- **Drop partial checks.** If the tool only does half the verdict (owns the visual half but not the
  functional half; extracts the measurement ID but can't confirm the request fired; captures the signal
  but the real verdict needs another tool or config), it is NOT 100% — leave it out.
- **Flat list — NO tiering.** Do **not** classify checks as additive / redundant / partial / visual, and
  do **not** assess whether Snurra already covers a check natively. Just list "the checks this tool can
  cover", each with a short note describing **what the tool does** to cover it. Never write "Snurra
  already does this / duplicates / redundant / replaces a DIY build".
- The catalog's `bucket` field (see §4) is useful **judgment input** for deciding what the tool genuinely
  does, but it must **never** surface as a tier or a Snurra-comparison in the output.
- **Verbatim names.** Every `ch:'…'` value must match a `check` string in `checks.ts` **exactly**
  (punctuation, em dashes, casing). The verify script enforces this.
- **The "does NOT cover" callout** lists whole excluded categories as genuine capability limits (functional
  interaction, visual regression, performance vitals, SSL/DNS, uptime, compliance *meaning*, geo *content
  correctness*, etc.) — framed as "the tool can't deliver these verdicts", NOT as "Snurra already does it".

De-tiering also applies to the TL;DR, Capabilities, Embedding and Recommendation prose: no
"vs Snurra / mostly redundant / additive slice" language anywhere. Talking about *how to integrate into
Snurra's worker* is fine; *assessing redundancy against Snurra* is not.

## 4. The checks catalog

- **Canonical data:** `D:\Projects\Effvision\feasibility-app\data\checks.ts` — **217 checks**,
  auto-generated. (Live SPA: `checks-catalog.vercel.app`.)
- **Parse pattern (Node):**
  ```js
  const start = s.indexOf("[", s.indexOf("=", s.indexOf("CHECKS")));
  const rows = JSON.parse(s.slice(start, s.lastIndexOf("]") + 1));
  ```
- **`Check` schema:** `{pillar, check, plainEnglish, mvp, bucket, effort, how, source, hero, phase,
  roadmap}`.
  - `check` — the verbatim name to map to.
  - `pillar` — the functional grouping (used for "which pillars it touches" and the `p:` field).
  - `plainEnglish` — what the check means (use to judge whether the tool truly covers it).
  - `how` — the intended implementation; names tools (PageSpeed, SSL Labs, Playwright DIY, Claude AI,
    axe-core…). Strong signal for judging coverage — but do **not** quote "DIY build / Snurra native" into
    the output.
  - `bucket ∈ spectera | thirdparty | agentic | build | human` — `spectera` = already native in Snurra's
    Site Audit; `build` = a planned DIY build; `agentic` = needs Claude/AI text judgment; `human` =
    manual; `thirdparty` = an external API. Judgment input only — never a tier in the output.
- **To survey candidate checks:** dump checks whose pillar/name/plainEnglish/how match the tool's domain
  keywords, then judge each against the 100% bar. (There is no native tool→check field; mapping is manual.)

## 5. Writing the HTML

Copy `assets/template.html` and adapt. Keep this section skeleton (kickers `01`…`08`):

1. **Hero + TL;DR** — one-line positioning, then a "Bottom line up front" panel with 3 verdict cards
   (`.vcard` + `.pill good/warn/bad`): Technical fit, What it covers, Cost. State the flat coverage count
   ("N checks it can cover") — no additive/redundant language. **Immediately after the `<h1>`, emit the
   `snurraFit` pill** (the inline-styled block in `assets/template.html`): a coloured "Fits into Snurra:
   &lt;label&gt;" chip + the one-line `fitNote`, using the tier's colour/label from §2.3.
2. **Capabilities** — tabbed (`.tab`/`.tabpane`): what the tool does / its automation surface. Include a
   card for the **standards** it relies on.
3. **Embedding paths** — a fit table (`.fit`/`.fitrow`, `.badge best/ok/cond/no`) ranking realistic ways
   to wire it into Snurra, plus the integration-shape callout (request/response, auth, adapter type,
   graceful degradation). This section carries the §2.3 integration answers.
4. **API / Technical** — accordions (`.acc`): auth + endpoints (show a `codeblock` request/response),
   rate limits, "projects"/scale/licensing, real-browser/device/geo, webhooks/scheduling.
5. **Ecosystem / frameworks** — searchable filter grid driven by `INTS[]` (`{n,c,d}`; chips by category
   `c`).
6. **Pricing** — a `table.price` with every tier + the metering dimension + free tier; flag third-party
   figures.
7. **Coverage** — the flat `COV[]` list. Intro states the 100% bar and that partial checks are excluded.
   **Search box only — no tier filter chips.** Count line: `Showing N of N checks <Tool> can cover`. Then a
   second block, **"Additional checks it can cover — not in the catalog"** (its own sub-heading + a
   `.covgrid` driven by `NEWCOV[]`): the deterministic checks the tool covers that have no `checks.ts`
   equivalent — candidate new catalog checks, each with a reference. Then the "What it does NOT cover"
   `.callout.bad`.
8. **References** — `.refs` with a source per claim.
9. **Footer** — disclaimer + "Prepared <date> · for internal planning".

### The JS data arrays
- **`INTS[]`** — ecosystem/features: `{n:'name', c:'Category', d:'one-line desc'}`. Category chips are
  derived from the `c` values.
- **`COV[]`** — coverage: `{ch:'verbatim check name', p:'Pillar', cap:'the tool capability used',
  gate:['licence','audit',…], note:'what the tool does to cover it'}`. **No `t:` field.** The render must
  NOT emit a tier tag and there must be NO tier filter chips. Count = `Showing <b>N</b> of N checks
  <Tool> can cover`.
- **`NEWCOV[]`** — checks the tool covers that are **not in the catalog** (candidate additions):
  `{name:'new check name', cap:'the tool capability', note:'what it checks + note that the catalog has no
  equivalent', ref:'short source'}`. Use the key **`name:` (NOT `ch:`)** so `verify_coverage.js` — which
  scans `{ch:'…'}` inside the `COV` block — never tests these against `checks.ts`. Render them in a
  `.covgrid` under an "Additional checks — not in the catalog" heading. Every entry still needs a reference.
- **`RECS{}`** — scenario recommender: `{a:{label,h,p,s:[…steps]}, …}`; the picker buttons map to keys.
  Frame scenarios around how to USE the tool, not "don't duplicate Snurra".

## 6. Verifying

1. **Names:** `node <skill>/scripts/verify_coverage.js <tool>-analysis.html` — must print
   "OK all N coverage names match checks.ts verbatim" and no LEFTOVER TIER markers. Fix any MISSING name
   to match `checks.ts` exactly.
2. **References completeness:** confirm every pricing figure, rate limit, project/run cap, API detail and
   named standard has a matching References entry (or a visible inline third-party/unverified flag). Once
   more: an unsourced claim is a defect — hunt them down before declaring the artifact done.
3. **Render:** open `file:///D:/Projects/Effvision/<tool>-analysis.html` in the browser pane; check
   `read_console_messages onlyErrors:true` is clean; assert via `javascript_tool` that `#covGrid .covitem`
   count == COV length, the count line reads "…checks <Tool> can cover", `#coverage .chip` == 0 (no tier
   chips), `#covGrid .ttag` == 0, and the search box / tabs / accordions / scenario picker / theme toggle
   work.

## 6.5 Keeping the coverage summary in sync (always)

The coverage summary is **native** to the feasibility app: `feasibility-app/components/ToolsSummary.tsx`
renders the `TOOLS[]` array in `feasibility-app/app/tools-analysis/toolsData.ts` as an expandable row per
tool (counts, cost, integration, limitations, full check lists) in the app's own light/dark theme — no
iframe, no standalone HTML. `toolsData.ts` is the single source of truth and **must be updated on every add
or edit of an analysis**, so it never drifts from the artifacts.

- The data is a single typed `TOOLS: Tool[]` array in `toolsData.ts`. Each entry:
  `{name, file, snurraFit, fitNote, ident, costShort, cost, integ:{Input,API,'Adapter fit'}, lims:[…],
  cov:[…verbatim…], newcov:[…verbatim…]}`. `snurraFit` is one of `api-native | api-with-setup | no-api`
  and `fitNote` is the same one-liner as the artifact's hero pill (§2.3) — the component renders these as the
  coloured fit pill + "Fits into Snurra:" line on each row (a `FIT` map + legend already exist in
  `toolsData.ts` / `ToolsSummary.tsx`; just set the two fields). The totals strip (distinct-union / 217,
  tool→check sum, net-new sum) is computed from `TOOLS[]` at render — you never hand-edit the totals.
- **`cov`/`newcov` must be verbatim-identical to the artifact's `COV[]`/`NEWCOV[]`.** Generate the entry with
  `scripts/summary_entry.js <tool-slug>-analysis.html` (it extracts them exactly, prints the counts, and emits
  a paste-ready TypeScript object), fill the prose fields, then **add** (new tool) or **replace** (edited
  tool) that entry in `TOOLS[]` in `toolsData.ts`.
- Do not restyle the summary — `ToolsSummary.tsx` uses the app's design tokens (`.tsum-*` classes in
  `app/globals.css`) and follows the host light/dark theme automatically; you only touch data in
  `toolsData.ts`. The old standalone `tools-coverage-summary.html` has been **retired** — do not recreate it.

## 7. Gotchas

- **Curly apostrophes in `COV[]` notes.** The notes are single-quoted JS strings. Use a curly `’` (or
  `\'`) for any apostrophe inside a note, otherwise a straight `'` closes the string and breaks the array.
- **Grep/Glob skip the root-level HTML artifacts** in `D:\Projects\Effvision` (ignore-file interaction) —
  locate them by exact filename or `ls`, not content search. Editing/reading by full path works fine.
- **Verbatim or it's wrong.** A near-miss check name (extra space, wrong dash, dropped word) fails the
  verify and silently misrepresents coverage. Always run the verify script.
- **Absolute dates.** Stamp "Prepared <today's date>" and convert any "recently/last week" into an
  absolute date.
- **No unsourced facts — final reminder.** If a number or capability isn't backed by a reference (or
  explicitly flagged as third-party/unverified), it must not appear as a stated fact. When in doubt, under-
  claim and flag rather than assert.
- After finishing, add/update the artifact's line in the memory file
  `feasibility-tool-eval-artifacts.md` (flat-coverage count, one-line tool identity).
