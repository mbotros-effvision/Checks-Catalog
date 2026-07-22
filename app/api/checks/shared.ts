import type { BucketKey, CheckInput, Effort, IterationInput, Mvp, Phase, Prio } from '@/types';

const BUCKETS: BucketKey[] = ['spectera', 'thirdparty', 'agentic', 'build', 'human'];
const EFFORTS: Effort[] = ['Live', 'Low', 'Medium', 'High', 'N/A'];
const PHASES: Phase[] = ['A', 'B'];
const MVPS: Mvp[] = ['MVP', 'Post-MVP', 'Duplicated'];
const PRIOS: Prio[] = ['high', 'med', 'low', ''];

/** Validate + normalize a request body into a CheckInput, or return an error. */
export function coerceInput(body: unknown): CheckInput | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'invalid-body' };
  const b = body as Record<string, unknown>;

  const pillar = String(b.pillar ?? '').trim();
  const check = String(b.check ?? '').trim();
  const source = String(b.source ?? '').trim();
  if (!pillar || !check || !source) return { error: 'pillar, check and source are required' };

  const mvp = (MVPS.includes(b.mvp as Mvp) ? b.mvp : 'Post-MVP') as Mvp;
  const dupOf = String(b.dupOf ?? '').trim();
  if (mvp === 'Duplicated' && !dupOf) return { error: 'dupOf is required when mvp is Duplicated' };

  return {
    pillar,
    check,
    plainEnglish: String(b.plainEnglish ?? '').trim(),
    bucket: (BUCKETS.includes(b.bucket as BucketKey) ? b.bucket : 'human') as BucketKey,
    effort: (EFFORTS.includes(b.effort as Effort) ? b.effort : 'N/A') as Effort,
    how: String(b.how ?? '').trim(),
    source,
    hero: !!b.hero,
    phase: (PHASES.includes(b.phase as Phase) ? b.phase : 'A') as Phase,
    dupOf: mvp === 'Duplicated' ? dupOf : '',
    mvp,
    priority: (PRIOS.includes(b.priority as Prio) ? b.priority : '') as Prio,
    roadmap: String(b.roadmap ?? '').trim(),
  };
}

/** Same as coerceInput, plus an optional free-text comment (commit message). */
export function coerceIterationInput(body: unknown): IterationInput | { error: string } {
  const base = coerceInput(body);
  if ('error' in base) return base;
  const b = (body ?? {}) as Record<string, unknown>;
  return { ...(base as CheckInput), comment: String(b.comment ?? '').trim() };
}
