// Emit a ready-to-paste TOOLS[] entry for tools-coverage-summary.html from an
// existing analysis artifact — so the summary's cov/newcov lists stay VERBATIM
// in sync with the artifact whenever you add or edit a tool.
//
// Usage:  node summary_entry.js <tool-slug>-analysis.html
//   - path is absolute, or relative to the Effvision root.
//
// It parses the artifact's COV[] (ch:) and NEWCOV[] (name:) exactly as
// verify_coverage.js does, then prints a JS object literal. Fill in the prose
// fields (ident / costShort / cost / integ / lims) by hand, then paste the object
// into the TOOLS array in tools-coverage-summary.html (add a new entry, or replace
// the existing entry for this tool). The summary's totals recompute automatically.

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

console.log(`// ${cov.length} catalog · +${newcov.length} net-new  (paste into TOOLS[] in tools-coverage-summary.html)
  {
    name:${JSON.stringify(name)}, file:${JSON.stringify(slug)},
    ident:"ONE-LINE TOOL IDENTITY",
    costShort:"SHORT COST",
    cost:"FULL COST SENTENCE(S).",
    integ:{"Input":"...","API":"...","Adapter fit":"..."},
    lims:["...","...","..."],
    cov:${j(cov)},
    newcov:${j(newcov)}
  },`);
console.error(`\n[summary_entry] ${slug}: ${cov.length} cov, ${newcov.length} newcov — fill prose fields, then paste into TOOLS[].`);
