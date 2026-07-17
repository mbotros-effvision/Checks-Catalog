import { NextResponse } from 'next/server';
import type { CheckInput } from '@/types';
import { createCheck } from '@/lib/server/db';
import { coerceInput } from './shared';

export const dynamic = 'force-dynamic';

// Create a new (custom) check. Returns the stored row, including its new id.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = coerceInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const row = createCheck(parsed as CheckInput, true);
  return NextResponse.json(row, { status: 201 });
}
