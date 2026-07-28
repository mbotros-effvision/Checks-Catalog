// Verify a generated tool-eval artifact's coverage list against the feasibility catalog.
//
// Usage:  node verify_coverage.js <artifact.html> [path/to/checks.ts]
//   - <artifact.html>: absolute path, or path relative to the Effvision root.
//   - checks.ts defaults to D:/Projects/Effvision/feasibility-app/data/checks.ts
//
// It parses the COV=[{ch:'…'}] array out of the HTML, checks every `ch` name is
// VERBATIM present in checks.ts, and flags any leftover tier markers (the coverage
// list must be a single flat list — no additive/redundant/partial tiering).

const fs = require("fs");
const path = require("path");

const ROOT = "D:/Projects/Effvision";
const artifactArg = process.argv[2];
if (!artifactArg) { console.error("usage: node verify_coverage.js <artifact.html> [checks.ts]"); process.exit(2); }
const artifact = path.isAbsolute(artifactArg) ? artifactArg : path.join(ROOT, artifactArg);
const checksPath = process.argv[3] || path.join(ROOT, "feasibility-app/data/checks.ts");

// Parse checks.ts — the CHECKS array is a JSON literal after the `=`.
let s = fs.readFileSync(checksPath, "utf8");
const start = s.indexOf("[", s.indexOf("=", s.indexOf("CHECKS")));
const rows = JSON.parse(s.slice(start, s.lastIndexOf("]") + 1));
const names = new Set(rows.map(r => r.check));

// Parse the artifact's COV array. Names are single-quoted JS strings; apostrophes
// inside notes are typically curly (’) to avoid escaping, so a plain single-quote
// scan of the `ch:'…'` field is safe.
const html = fs.readFileSync(artifact, "utf8");
// Scope extraction to the COV array only, so the separate NEWCOV[] list (checks the
// tool covers that are NOT in the catalog) is never tested against checks.ts.
const covStart = html.indexOf("var COV");
const covBlock = covStart === -1 ? html : html.slice(covStart, html.indexOf("];", covStart) + 2);
const m = [...covBlock.matchAll(/\{ch:'((?:[^'\\]|\\.)*)'/g)].map(x => x[1].replace(/\\'/g, "'"));

console.log(path.basename(artifact) + " — COV entries:", m.length, "| unique:", new Set(m).size);

let bad = 0;
for (const c of m) { if (!names.has(c)) { console.log("  MISSING (not verbatim in checks.ts):", JSON.stringify(c)); bad++; } }

// Leftover tier markers should be zero.
["t:'additive'", "t:'redundant'", "t:'partial'", "t:'visual'"].forEach(t => {
  const n = html.split(t).length - 1;
  if (n) console.log("  LEFTOVER TIER MARKER " + t + ":", n);
});
// Tier filter chips should be gone too.
const chips = (html.match(/data-cov="(additive|redundant|partial|visual)"/g) || []).length;
if (chips) console.log("  LEFTOVER TIER CHIPS:", chips);

console.log(bad ? ("  " + bad + " mismatch(es) — fix the name to match checks.ts exactly") : ("  OK all " + m.length + " coverage names match checks.ts verbatim"));
process.exit(bad ? 1 : 0);
