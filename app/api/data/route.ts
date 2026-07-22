import { NextResponse } from 'next/server';
import { ensureRoadmapBackfilled, ensureSeeded, listChecks, listIterations, listPillars } from '@/lib/server/db';

// Always request-time (never statically cached).
export const dynamic = 'force-dynamic';

// Full snapshot: pillars + checks + iterations. Seeds reference data on first hit.
export async function GET() {
  await ensureSeeded();
  await ensureRoadmapBackfilled();
  const [pillars, checks, iterations] = await Promise.all([listPillars(), listChecks(), listIterations()]);
  return NextResponse.json({ pillars, checks, iterations });
}
