// Pure taxonomy helpers.
import type { BucketKey, Mvp, Prio } from '@/types';

export { BUCKET_ORDER, BUCKETS } from '@/data/taxonomy-data';

export const PRIO_LABEL: Record<Exclude<Prio, ''>, string> = { high: 'High', med: 'Medium', low: 'Low' };
export const PRIO_RANK: Record<Prio, number> = { high: 3, med: 2, low: 1, '': 0 };
export const EFFORT_RANK: Record<string, number> = { Live: 0, Low: 1, Medium: 2, High: 3, 'N/A': 4 };

/** CSS class suffix for a source badge, e.g. "Snurra QA" -> "src-Snurra". */
export function srcCls(source: string): string {
  return 'src-' + String(source).split(' ')[0];
}

/** CSS variant class for an MVP badge. */
export function mvpClass(v: Mvp | string): 'MVP' | 'Dup' | 'Post' {
  return v === 'MVP' ? 'MVP' : v === 'Duplicated' ? 'Dup' : 'Post';
}

/** Short MVP label shown in the read-only badge. */
export function mvpLabel(v: Mvp): string {
  return v === 'MVP' ? 'MVP' : v === 'Duplicated' ? 'Dup' : 'Post';
}

export const BUCKET_KEYS: BucketKey[] = ['spectera', 'thirdparty', 'agentic', 'build', 'human'];
