'use client';

// Persistence seam. Loads the full snapshot (pillars + checks + iterations) from
// the API and exposes async mutations. After any write it refetches so pillars,
// version numbers, and ids stay authoritative (the data set is small).
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CheckInput, CheckRow, IterationInput, IterationRow, PillarRow } from '@/types';

interface Snapshot {
  pillars: PillarRow[];
  checks: CheckRow[];
  iterations: IterationRow[];
}

export interface ReportState {
  loaded: boolean;
  pillars: PillarRow[];
  checks: CheckRow[];
  iterations: IterationRow[];
  /** iterations grouped by checkId, ascending by version. */
  iterationsByCheck: Map<number, IterationRow[]>;

  addCheck: (input: CheckInput) => Promise<CheckRow | null>;
  setCheckMeta: (id: number, patch: { active?: boolean; justification?: string }) => void;
  deleteCheck: (id: number) => Promise<void>;
  addIteration: (checkId: number, input: IterationInput) => Promise<IterationRow | null>;
  updateIteration: (id: number, input: IterationInput) => Promise<IterationRow | null>;
  deleteIteration: (id: number) => Promise<void>;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(url, init);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function useReportState(): ReportState {
  const [snap, setSnap] = useState<Snapshot>({ pillars: [], checks: [], iterations: [] });
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    const data = await getJson<Snapshot>('/api/data');
    if (data) setSnap({ pillars: data.pillars || [], checks: data.checks || [], iterations: data.iterations || [] });
  }, []);

  useEffect(() => {
    refetch().finally(() => setLoaded(true));
  }, [refetch]);

  const addCheck = useCallback(
    async (input: CheckInput) => {
      const row = await getJson<CheckRow>('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      await refetch();
      return row;
    },
    [refetch],
  );

  // Review-workflow metadata: optimistic local update + fire-and-forget PATCH
  // (no refetch — nothing else depends on it, keeps the toggle snappy).
  const setCheckMeta = useCallback((id: number, patch: { active?: boolean; justification?: string }) => {
    setSnap((prev) => ({ ...prev, checks: prev.checks.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    fetch(`/api/checks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const deleteCheck = useCallback(
    async (id: number) => {
      await fetch(`/api/checks/${id}`, { method: 'DELETE' }).catch(() => {});
      await refetch();
    },
    [refetch],
  );

  const addIteration = useCallback(
    async (checkId: number, input: IterationInput) => {
      const row = await getJson<IterationRow>('/api/iterations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkId, ...input }),
      });
      await refetch();
      return row;
    },
    [refetch],
  );

  const updateIteration = useCallback(
    async (id: number, input: IterationInput) => {
      const row = await getJson<IterationRow>(`/api/iterations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      await refetch();
      return row;
    },
    [refetch],
  );

  const deleteIteration = useCallback(
    async (id: number) => {
      await fetch(`/api/iterations/${id}`, { method: 'DELETE' }).catch(() => {});
      await refetch();
    },
    [refetch],
  );

  const iterationsByCheck = useMemo(() => {
    const m = new Map<number, IterationRow[]>();
    for (const it of snap.iterations) {
      const arr = m.get(it.checkId);
      if (arr) arr.push(it);
      else m.set(it.checkId, [it]);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.version - b.version);
    return m;
  }, [snap.iterations]);

  return {
    loaded,
    pillars: snap.pillars,
    checks: snap.checks,
    iterations: snap.iterations,
    iterationsByCheck,
    addCheck,
    setCheckMeta,
    deleteCheck,
    addIteration,
    updateIteration,
    deleteIteration,
  };
}
