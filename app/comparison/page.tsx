import { COMPARISON_MAP } from '@/data/comparison-map';
import { buildComparison } from '@/lib/comparison';
import { ensureMamtaSeeded, ensureSeeded, listChecks, listMamtaChecks } from '@/lib/server/db';
import { ComparisonView } from '@/components/ComparisonView';

// Always request-time (never statically cached).
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Comparison — Pillar Feasibility' };

export default async function ComparisonPage() {
  // This may be the first page hit on a fresh database, so seed both sets.
  await Promise.all([ensureSeeded(), ensureMamtaSeeded()]);
  const [catalog, mamta] = await Promise.all([listChecks(), listMamtaChecks()]);
  // Resolved against live catalog rows, so custom checks added on / show up
  // under "Only in catalog" without touching the mapping file.
  const result = buildComparison(mamta, catalog, COMPARISON_MAP);

  return (
    <div className="page">
      <div className="view-head">
        <h1 className="view-title">Comparison</h1>
        <p className="view-sub">
          {result.counts.mamtaTotal} Mamta checks against {result.counts.catalogTotal} catalog checks. A Mamta check
          can map to more than one catalog check, and the US and Ex-US versions of a check often map to the same one —
          so the two totals do not add up row for row.
        </p>
      </div>
      <ComparisonView result={result} />
    </div>
  );
}
