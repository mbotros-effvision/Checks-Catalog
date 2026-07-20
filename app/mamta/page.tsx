import { ensureMamtaSeeded, listMamtaChecks } from '@/lib/server/db';
import { MamtaTable } from '@/components/MamtaTable';

// Always request-time (never statically cached).
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Mamta Checks — Pillar Feasibility' };

export default async function MamtaPage() {
  await ensureMamtaSeeded();
  const rows = await listMamtaChecks();
  return (
    <div className="page">
      <div className="view-head">
        <h1 className="view-title">Mamta Checks</h1>
        <p className="view-sub">
          {rows.length} QA checks imported from the Chiesi Rare Diseases checklist workbook — 18 tabs covering the US
          and Ex-US sites. Read-only reference data.
        </p>
      </div>
      <MamtaTable rows={rows} />
    </div>
  );
}
