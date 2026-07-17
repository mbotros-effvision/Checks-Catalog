import { NextResponse } from 'next/server';
import { deleteIteration, updateIteration } from '@/lib/server/db';
import { coerceIterationInput } from '../../checks/shared';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Update a version's fields + comment (version number is immutable).
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const parsed = coerceIterationInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const row = await updateIteration(Number(id), parsed);
  if (!row) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const ok = await deleteIteration(Number(id));
  if (!ok) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
