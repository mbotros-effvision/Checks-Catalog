import ExcelJS from 'exceljs';
import type { IterationRow } from '@/types';
import { listChecks, listIterations } from '@/lib/server/db';
import { BUCKETS, PRIO_LABEL } from '@/lib/taxonomy';

export const dynamic = 'force-dynamic';

// Download an .xlsx with one row per check, using each check's LATEST version
// (falling back to the base check when it has no versions).
export async function GET() {
  const [checks, iterations] = await Promise.all([listChecks(), listIterations()]);

  const byCheck = new Map<number, IterationRow[]>();
  for (const it of iterations) {
    const arr = byCheck.get(it.checkId);
    if (arr) arr.push(it);
    else byCheck.set(it.checkId, [it]);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Checks');
  ws.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Version', key: 'version', width: 9 },
    { header: 'Pillar', key: 'pillar', width: 22 },
    { header: 'Layer', key: 'layer', width: 28 },
    { header: 'Check', key: 'check', width: 42 },
    { header: 'Plain English', key: 'plainEnglish', width: 55 },
    { header: 'How', key: 'how', width: 55 },
    { header: 'Source', key: 'source', width: 14 },
    { header: 'Feasibility', key: 'feasibility', width: 24 },
    { header: 'Effort', key: 'effort', width: 9 },
    { header: 'Phase', key: 'phase', width: 7 },
    { header: 'Hero', key: 'hero', width: 7 },
    { header: 'MVP', key: 'mvp', width: 12 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Active', key: 'active', width: 10 },
    { header: 'Justification', key: 'justification', width: 45 },
  ];

  for (const c of checks) {
    const vers = (byCheck.get(c.id) ?? []).slice().sort((a, b) => a.version - b.version);
    const latest = vers.length ? vers[vers.length - 1] : null;
    const src = latest ?? c;
    ws.addRow({
      id: c.id,
      version: latest ? `v${latest.version}` : 'Base',
      pillar: src.pillar,
      layer: src.layer,
      check: src.check,
      plainEnglish: src.plainEnglish,
      how: src.how,
      source: src.source,
      feasibility: BUCKETS[src.bucket]?.label ?? src.bucket,
      effort: src.effort,
      phase: src.phase,
      hero: src.hero ? 'Yes' : '',
      mvp: src.mvp,
      priority: src.priority ? PRIO_LABEL[src.priority as 'high' | 'med' | 'low'] : '',
      active: c.active ? 'Active' : 'Inactive',
      justification: c.justification,
    });
  }

  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'P1' };

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="checks-catalog.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
