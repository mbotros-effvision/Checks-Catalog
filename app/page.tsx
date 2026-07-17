'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CheckInput, CheckRow, DisplayRow, Filters, IterationRow } from '@/types';
import { EMPTY_FILTERS, filteredRows } from '@/lib/filters';
import { useReportState } from '@/lib/report-state';
import { Toolbar } from '@/components/Toolbar';
import { ChecksTable } from '@/components/ChecksTable';
import { EditorModal } from '@/components/EditorModal';

const BLANK_INPUT: CheckInput = {
  pillar: '', check: '', plainEnglish: '', bucket: 'human',
  effort: 'N/A', how: '', source: '', hero: false, phase: 'A', dupOf: '', mvp: 'Post-MVP', priority: '',
};

function toInput(r: CheckRow | IterationRow): CheckInput {
  return {
    pillar: r.pillar, check: r.check, plainEnglish: r.plainEnglish, bucket: r.bucket,
    effort: r.effort, how: r.how, source: r.source, hero: r.hero, phase: r.phase, dupOf: r.dupOf,
    mvp: r.mvp, priority: r.priority,
  };
}

interface ModalState {
  open: boolean;
  mode: 'add-check' | 'add-version' | 'edit-version';
  title: string;
  checkId: number;
  iterationId: number;
  showComment: boolean;
  showDelete: boolean;
  initial: CheckInput;
  initialComment: string;
}

const CLOSED: ModalState = {
  open: false, mode: 'add-check', title: '', checkId: 0, iterationId: 0,
  showComment: false, showDelete: false, initial: BLANK_INPUT, initialComment: '',
};

export default function Page() {
  const state = useReportState();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedVersion, setSelectedVersion] = useState<Record<number, number>>({});
  const [modal, setModal] = useState<ModalState>(CLOSED);

  const pillarNames = useMemo(() => state.pillars.map((p) => p.name), [state.pillars]);

  const baseRows = useMemo(() => filteredRows(state.checks, filters), [state.checks, filters]);
  const grouped = filters.sort === '';

  const displayRows: DisplayRow[] = useMemo(
    () =>
      baseRows.map((c) => {
        const versions = state.iterationsByCheck.get(c.id) ?? [];
        const selId = selectedVersion[c.id] || 0;
        const sel = selId ? versions.find((v) => v.id === selId) ?? null : null;
        const src = sel ?? c;
        const latest = versions.length ? versions[versions.length - 1] : null;
        // Prefill for a new version: copy the latest version, or the base check
        // with How blanked when there are no versions yet.
        const newVersionInput: CheckInput = latest ? toInput(latest) : { ...toInput(c), how: '' };
        return {
          checkId: c.id,
          custom: c.custom,
          active: c.active,
          justification: c.justification,
          versionLabel: sel ? `v${sel.version}` : 'Base',
          selectedIterationId: sel ? sel.id : 0,
          versions,
          pillar: src.pillar, check: src.check, plainEnglish: src.plainEnglish,
          bucket: src.bucket, effort: src.effort, how: src.how, source: src.source, hero: src.hero,
          phase: src.phase, dupOf: src.dupOf, mvp: src.mvp, priority: src.priority,
          newVersionInput,
        };
      }),
    [baseRows, state.iterationsByCheck, selectedVersion],
  );

  const onFilterChange = useCallback((patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch })), []);
  const onClear = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const onSelectVersion = useCallback((checkId: number, iterationId: number) => {
    setSelectedVersion((prev) => ({ ...prev, [checkId]: iterationId }));
  }, []);

  const onSetActive = useCallback((checkId: number, active: boolean) => state.setCheckMeta(checkId, { active }), [state]);
  const onSaveJustification = useCallback(
    (checkId: number, justification: string) => state.setCheckMeta(checkId, { justification }),
    [state],
  );

  // ---- add check (still a modal) ----
  const onAddCheck = useCallback(() => {
    setModal({ ...CLOSED, open: true, mode: 'add-check', title: 'Add check', initial: BLANK_INPUT });
  }, []);

  // ---- versions are created/edited inline (no modal) ----
  const onCreateVersion = useCallback(
    async (checkId: number, input: CheckInput, comment: string) => {
      const created = await state.addIteration(checkId, { ...input, comment });
      if (created) setSelectedVersion((prev) => ({ ...prev, [checkId]: created.id }));
    },
    [state],
  );

  const onUpdateVersion = useCallback(
    (iterationId: number, input: CheckInput, comment: string) => {
      state.updateIteration(iterationId, { ...input, comment });
    },
    [state],
  );

  // ---- mutations ----
  const clearSelectionFor = useCallback((checkId: number) => {
    setSelectedVersion((prev) => {
      if (!(checkId in prev)) return prev;
      const next = { ...prev };
      delete next[checkId];
      return next;
    });
  }, []);

  const onSubmit = useCallback(
    async (input: CheckInput) => {
      setModal(CLOSED);
      await state.addCheck(input);
    },
    [state],
  );

  const onDeleteVersion = useCallback(
    async (iterationId: number) => {
      const it = state.iterations.find((i) => i.id === iterationId);
      // eslint-disable-next-line no-alert
      if (!window.confirm('Delete this version?')) return;
      if (it) clearSelectionFor(it.checkId);
      await state.deleteIteration(iterationId);
    },
    [state, clearSelectionFor],
  );

  const onDeleteCheck = useCallback(
    async (checkId: number) => {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Delete this custom check and all its versions?')) return;
      clearSelectionFor(checkId);
      await state.deleteCheck(checkId);
    },
    [state, clearSelectionFor],
  );

  const customCount = useMemo(() => state.checks.filter((c) => c.custom).length, [state.checks]);

  return (
    <div className="page">
      <Toolbar
        filters={filters}
        pillars={pillarNames}
        shownCount={displayRows.length}
        totalCount={state.checks.length}
        customCount={customCount}
        onFilterChange={onFilterChange}
        onClear={onClear}
        onAddCheck={onAddCheck}
      />
      <ChecksTable
        rows={displayRows}
        grouped={grouped}
        onSelectVersion={onSelectVersion}
        onCreateVersion={onCreateVersion}
        onUpdateVersion={onUpdateVersion}
        onDeleteVersion={onDeleteVersion}
        onDeleteCheck={onDeleteCheck}
        onSetActive={onSetActive}
        onSaveJustification={onSaveJustification}
      />

      <EditorModal
        open={modal.open}
        title={modal.title}
        initial={modal.initial}
        initialComment={modal.initialComment}
        showComment={modal.showComment}
        showDelete={modal.showDelete}
        pillars={pillarNames}
        onSubmit={onSubmit}
        onClose={() => setModal(CLOSED)}
      />
    </div>
  );
}
