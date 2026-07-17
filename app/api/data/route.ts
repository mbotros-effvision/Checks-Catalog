import { NextResponse } from 'next/server';
import { ensureSeeded, listChecks, listIterations, listPillars } from '@/lib/server/db';

// Always request-time (never statically cached).
export const dynamic = 'force-dynamic';

// Full snapshot: pillars + checks + iterations. Seeds reference data on first hit.
export async function GET() {
  ensureSeeded();
  return NextResponse.json({ pillars: listPillars(), checks: listChecks(), iterations: listIterations() });
}
