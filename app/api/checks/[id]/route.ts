import { NextResponse } from 'next/server';
import { deleteCheck, updateCheckMeta } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Update review-workflow metadata (active / justification) — allowed on base
// checks too, since these aren't content edits.
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  let body: { active?: unknown; justification?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const patch: { active?: boolean; justification?: string } = {};
  if (typeof body.active === 'boolean') patch.active = body.active;
  if (typeof body.justification === 'string') patch.justification = body.justification;
  const row = updateCheckMeta(Number(id), patch);
  if (!row) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(row);
}

// Base check fields are read-only (edits happen via versions), so there is no
// PUT here — only delete of a whole check (cascades its versions).
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const ok = deleteCheck(Number(id));
  if (!ok) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
