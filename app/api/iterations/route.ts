import { NextResponse } from 'next/server';
import { createIteration } from '@/lib/server/db';
import { coerceIterationInput } from '../checks/shared';

export const dynamic = 'force-dynamic';

// Create the next version for a check. Body: { checkId, ...fields, comment? }.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const checkId = Number(body.checkId);
  if (!Number.isInteger(checkId)) return NextResponse.json({ error: 'checkId required' }, { status: 400 });

  const parsed = coerceIterationInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const row = createIteration(checkId, parsed);
  if (!row) return NextResponse.json({ error: 'check-not-found' }, { status: 404 });
  return NextResponse.json(row, { status: 201 });
}
