// Pure taxonomy helpers.
import type { BucketKey, Layer, Mvp, Prio } from '@/types';
import { LAYERS, LAYER_PILLARS } from '@/data/taxonomy-data';

export { LAYERS, LAYER_BG, LAYER_PILLARS, BUCKET_ORDER, BUCKETS } from '@/data/taxonomy-data';

export const PRIO_LABEL: Record<Exclude<Prio, ''>, string> = { high: 'High', med: 'Medium', low: 'Low' };
export const PRIO_RANK: Record<Prio, number> = { high: 3, med: 2, low: 1, '': 0 };
export const EFFORT_RANK: Record<string, number> = { Live: 0, Low: 1, Medium: 2, High: 3, 'N/A': 4 };

/**
 * Which layer a pillar belongs to (used when seeding reference data). User-added
 * pillars can carry an explicit layer; otherwise the built-in layer2/3/4/5 lists
 * decide, with Layer 1 as the fallback.
 */
export function layerOf(pillar: string, customLayers: Record<string, Layer> = {}): Layer {
  if (customLayers[pillar]) return customLayers[pillar];
  if (LAYER_PILLARS.layer5.indexOf(pillar) >= 0) return LAYERS[4];
  if (LAYER_PILLARS.layer4.indexOf(pillar) >= 0) return LAYERS[3];
  if (LAYER_PILLARS.layer2.indexOf(pillar) >= 0) return LAYERS[1];
  if (LAYER_PILLARS.layer3.indexOf(pillar) >= 0) return LAYERS[2];
  return LAYERS[0];
}

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
