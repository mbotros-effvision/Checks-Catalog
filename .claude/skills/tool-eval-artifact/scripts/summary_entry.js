// Emit a ready-to-paste TOOLS[] entry for the NATIVE coverage summary from an
// existing analysis artifact — so the summary's cov/newcov lists stay VERBATIM
// in sync with the artifact whenever you add or edit a tool.
//
// The summary is a React component: components/ToolsSummary.tsx renders the
// TOOLS[] array in app/tools-analysis/toolsData.ts. (The old standalone
// tools-coverage-summary.html has been retired.)
//
// Usage:  node summary_entry.js <tool-slug>-analysis.html
//   - path is absolute, or relative to the Effvision root.
//
// It parses the artifact's COV[] (ch:) and NEWCOV[] (name:) exactly as
// verify_coverage.js does, then prints a TypeScript object literal. Fill in the
// prose fields (ident / costShort / cost / integ / lims) by hand, then paste the
// object into the TOOLS array in app/tools-analysis/toolsData.ts (add a new entry,
// or replace the existing entry for this tool). The totals recompute at render.

const fs = require("fs");
const path = require("path");

const ROOT = "D:/Projects/Effvision";
const arg = process.argv[2];
if (!arg) { console.error("usage: node summary_entry.js <artifact.html>"); process.exit(2); }
const file = path.isAbsolute(arg) ? arg : path.join(ROOT, arg);
const slug = path.basename(file);

const html = fs.readFileSync(file, "utf8");

function pull(varName, key) {
  const start = html.indexOf("var " + varName);
  if (start === -1) return [];
  const block = html.slice(start, html.indexOf("];", start) + 2);
  const re = new RegExp("\\{" + key + ":'((?:[^'\\\\]|\\\\.)*)'", "g");
  return [...block.matchAll(re)].map(x => x[1].replace(/\\'/g, "'"));
}
const cov = pull("COV", "ch");
const newcov = pull("NEWCOV", "name");

// Try to read the tool's display name from the <title>.
const m = html.match(/<title>([^<—]+?)\s*[—-]/);
const name = m ? m[1].trim() : "TOOL NAME";

const j = a => "[" + a.map(s => JSON.stringify(s)).join(",") + "]";

console.log(`// ${cov.length} catalog · +${newcov.length} net-new  (paste into TOOLS[] in app/tools-analysis/toolsData.ts)
  {
    name: ${JSON.stringify(name)}, file: ${JSON.stringify(slug)},
    snurraFit: 'api-native | api-with-setup | no-api', fitNote: "ONE LINE: can I integrate this via API, and what's the catch (the same sentence as the artifact hero pill).",
    ident: 'ONE-LINE TOOL IDENTITY',
    costShort: 'SHORT COST',
    cost: 'FULL COST SENTENCE(S).',
    integ: { 'Input': '...', 'API': '...', 'Adapter fit': '...' },
    lims: ['...', '...', '...'],
    cov: ${j(cov)},
    newcov: ${j(newcov)},
  },`);
console.error(`\n[summary_entry] ${slug}: ${cov.length} cov, ${newcov.length} newcov — fill prose fields, then paste into TOOLS[] in app/tools-analysis/toolsData.ts.`);
