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
          Each side is broken down against its own total. They do not add together: the US and Ex-US versions of a
          Mamta check usually map to a single catalog check, so {result.counts.matched + result.counts.near} matched
          and near-matched Mamta rows resolve onto only {result.counts.catalogCovered} catalog checks.
        </p>
      </div>
      <ComparisonView result={result} />
    </div>
  );
}
