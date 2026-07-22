'use client';

import { Fragment, useState } from 'react';
import { ChevronRight, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CheckInput, DisplayRow, IterationRow } from '@/types';
import { mvpClass, mvpLabel, PRIO_LABEL, srcCls } from '@/lib/taxonomy';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { InlineVersionForm } from './InlineVersionForm';

export interface ChecksTableProps {
  rows: DisplayRow[];
  grouped: boolean;
  onSelectVersion: (checkId: number, iterationId: number) => void;
  onCreateVersion: (checkId: number, input: CheckInput, comment: string) => void;
  onUpdateVersion: (iterationId: number, input: CheckInput, comment: string) => void;
  onDeleteVersion: (iterationId: number) => void;
  onDeleteCheck: (checkId: number) => void;
  onSetActive: (checkId: number, active: boolean) => void;
  onSaveJustification: (checkId: number, justification: string) => void;
}

function iterationToInput(v: IterationRow): CheckInput {
  return {
    pillar: v.pillar, check: v.check, plainEnglish: v.plainEnglish, bucket: v.bucket,
    effort: v.effort, how: v.how, source: v.source, hero: v.hero, phase: v.phase, dupOf: v.dupOf,
    mvp: v.mvp, priority: v.priority, roadmap: v.roadmap,
  };
}

function JustificationEditor({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(false);
  return (
    <div className="just-box">
      <label>Justification / review notes</label>
      <textarea
        value={text}
        placeholder="Why is this check deactivated (or any review note)…"
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
      />
      <div className="just-row">
        <Button variant="outline" size="sm" onClick={() => { onSave(text.trim()); setSaved(true); }}>
          Save note
        </Button>
        {saved && <span className="just-status">Saved ✓</span>}
      </div>
    </div>
  );
}

interface FormState {
  checkId: number;
  iterationId: number | null;
  title: string;
  initial: CheckInput;
  initialComment: string;
}

export function ChecksTable({
  rows,
  grouped,
  onSelectVersion,
  onCreateVersion,
  onUpdateVersion,
  onDeleteVersion,
  onDeleteCheck,
  onSetActive,
  onSaveJustification,
}: ChecksTableProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  function toggle(checkId: number) {
    setOpenId((cur) => (cur === checkId ? null : checkId));
  }

  function openAdd(r: DisplayRow) {
    const next = r.versions.length ? r.versions[r.versions.length - 1].version + 1 : 1;
    setForm({ checkId: r.checkId, iterationId: null, title: `New version (v${next})`, initial: r.newVersionInput, initialComment: '' });
  }
  function openEdit(checkId: number, v: IterationRow) {
    setForm({ checkId, iterationId: v.id, title: `Edit v${v.version}`, initial: iterationToInput(v), initialComment: v.comment });
  }
  function saveForm(input: CheckInput, comment: string) {
    if (!form) return;
    if (form.iterationId === null) onCreateVersion(form.checkId, input, comment);
    else onUpdateVersion(form.iterationId, input, comment);
    setForm(null);
  }

  let lastPillar = '';

  return (
    <div className="tbl-scroll">
      <table>
        <thead>
          <tr>
            <th style={{ width: '44px' }}>ID</th>
            <th style={{ width: '10%' }}>Pillar</th>
            <th style={{ width: '19%' }}>Check</th>
            <th style={{ width: '20%' }}>Plain English</th>
            <th style={{ width: '15%' }}>Roadmap</th>
            <th style={{ width: '78px' }}>Source</th>
            <th style={{ width: '46px' }}>MVP</th>
            <th style={{ width: '70px' }}>Priority</th>
            <th style={{ width: '52px' }}>Active</th>
            <th style={{ width: '112px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const onVersion = r.selectedIterationId !== 0;
            const showBand = grouped && r.pillar !== lastPillar;
            if (showBand) lastPillar = r.pillar;
            const open = openId === r.checkId;
            const rowCls =
              'data expandable' +
              (open ? ' is-open' : '') +
              (r.custom ? ' is-added' : '') +
              (!r.active ? ' is-inactive' : '');

            return (
              <Fragment key={r.checkId}>
                {showBand && (
                  <tr className="ph">
                    <td colSpan={10}>
                      <div className="ph-band" style={{ ['--lc' as string]: 'var(--accent)' }}>
                        <span className="pn">{r.pillar}</span>
                      </div>
                    </td>
                  </tr>
                )}
                <tr className={rowCls} onClick={() => toggle(r.checkId)}>
                  <td>
                    <span className="cell-id">{r.checkId}</span>
                  </td>
                  <td>
                    <span className="cell-pillar">{r.pillar}</span>
                  </td>
                  <td>
                    <button
                      className="cn-btn"
                      type="button"
                      aria-expanded={open}
                      title={open ? 'Hide versions' : 'Show versions'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(r.checkId);
                      }}
                    >
                      <ChevronRight className="row-caret" size={13} aria-hidden />
                      <span className="cn">{r.check}</span>
                      <span className={'ver-cur' + (onVersion ? ' is-ver' : '')}>
                        {onVersion ? r.versionLabel : `Versions · ${r.versions.length}`}
                      </span>
                      {r.mvp === 'Duplicated' && r.dupOf && (
                        <span className="dup-i" title="Duplicated from">
                          Dup · <span className="dup-of">{r.dupOf}</span>
                        </span>
                      )}
                      {r.custom && <span className="custom-i" title="Custom check">✎</span>}
                    </button>
                    {!r.active && r.justification && <span className="just-snippet">“{r.justification}”</span>}
                  </td>
                  <td>
                    <div className="pl">{r.plainEnglish}</div>
                  </td>
                  <td>
                    <div className="pl">{r.roadmap}</div>
                  </td>
                  <td>
                    <span className={'src ' + srcCls(r.source)}>{r.source}</span>
                  </td>
                  <td>
                    <span className={'mvp-ro is-' + mvpClass(r.mvp)}>{mvpLabel(r.mvp)}</span>
                  </td>
                  <td>
                    <span className={'prio-ro ' + (r.priority ? 'prio-' + r.priority : 'prio-none')}>
                      {r.priority ? PRIO_LABEL[r.priority] : '—'}
                    </span>
                  </td>
                  <td className="active-cell" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={r.active}
                      onCheckedChange={(next) => onSetActive(r.checkId, next)}
                      aria-label={r.active ? 'Deactivate check' : 'Activate check'}
                      title={r.active ? 'Active — click to deactivate' : 'Deactivated — click to activate'}
                    />
                  </td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openAdd(r)} title="Add a version (copies the latest)">
                      <Plus size={13} aria-hidden /> Version
                    </Button>
                  </td>
                </tr>

                {open && (
                  <tr className="ver-exp">
                    <td colSpan={10}>
                      <div className="ver-anim">
                        <div className="ver-anim-inner">
                          <div className="ver-panel">
                            <JustificationEditor value={r.justification} onSave={(t) => onSaveJustification(r.checkId, t)} />
                            <div className="ver-panel-h">Versions of #{r.checkId} — {r.check}</div>
                            <div className="ver-list">
                              <div className={'ver-line' + (!onVersion ? ' sel' : '')}>
                                <button className="ver-pick" type="button" onClick={() => onSelectVersion(r.checkId, 0)}>
                                  <span className="vlabel">Base</span>
                                  <span className="vmeta">{r.custom ? 'custom check (original)' : 'reference (original)'}</span>
                                </button>
                                {!onVersion && <span className="ver-viewing"><Eye size={11} aria-hidden /> viewing</span>}
                              </div>
                              {r.versions.map((v) => {
                                const sel = r.selectedIterationId === v.id;
                                return (
                                  <div key={v.id} className={'ver-line' + (sel ? ' sel' : '')}>
                                    <button className="ver-pick" type="button" onClick={() => onSelectVersion(r.checkId, v.id)}>
                                      <span className="vlabel">v{v.version}</span>
                                      <span className="vmeta">{v.comment || v.check}</span>
                                    </button>
                                    {sel && <span className="ver-viewing"><Eye size={11} aria-hidden /> viewing</span>}
                                    <Button variant="outline" size="sm" onClick={() => openEdit(r.checkId, v)}>
                                      <Pencil size={12} aria-hidden /> Edit
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => onDeleteVersion(v.id)}>
                                      <Trash2 size={12} aria-hidden /> Delete
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                            {r.custom && (
                              <div className="ver-panel-actions">
                                <Button variant="destructive" size="default" onClick={() => onDeleteCheck(r.checkId)}>
                                  <Trash2 size={13} aria-hidden /> Delete check
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {form?.checkId === r.checkId && (
                  <tr className="ivf-row">
                    <td colSpan={10}>
                      <InlineVersionForm
                        title={form.title}
                        initial={form.initial}
                        initialComment={form.initialComment}
                        onSave={saveForm}
                        onCancel={() => setForm(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="no-results">No checks match the current filters.</div>}
    </div>
  );
}
