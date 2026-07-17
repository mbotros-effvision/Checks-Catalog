'use client';

import { useEffect, useState } from 'react';
import type { BucketKey, CheckInput, Effort, Layer, Mvp, Phase, Prio } from '@/types';
import { BUCKET_ORDER, BUCKETS, LAYERS } from '@/lib/taxonomy';

export interface EditorModalProps {
  open: boolean;
  title: string;
  initial: CheckInput;
  initialComment: string;
  showComment: boolean; // true for versions
  showDelete: boolean; // true when editing an existing version
  pillars: string[];
  layerOfPillar: (pillar: string) => Layer;
  onSubmit: (input: CheckInput, comment: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function EditorModal({
  open,
  title,
  initial,
  initialComment,
  showComment,
  showDelete,
  pillars,
  layerOfPillar,
  onSubmit,
  onDelete,
  onClose,
}: EditorModalProps) {
  const [form, setForm] = useState<CheckInput>(initial);
  const [comment, setComment] = useState(initialComment);
  const [err, setErr] = useState('');

  // Reset from the incoming values each time the modal opens / target changes.
  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setComment(initialComment);
    setErr('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, initialComment]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function set<K extends keyof CheckInput>(key: K, value: CheckInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    const pillar = form.pillar.trim();
    const check = form.check.trim();
    const source = form.source.trim();
    const dupOf = form.dupOf.trim();
    if (!pillar || !check || !source) {
      setErr('Pillar, Check and Source are required.');
      return;
    }
    if (form.mvp === 'Duplicated' && !dupOf) {
      setErr('Please enter the Check name this metric is duplicated from.');
      return;
    }
    onSubmit(
      {
        ...form,
        pillar,
        check,
        source,
        plainEnglish: form.plainEnglish.trim(),
        how: form.how.trim(),
        dupOf: form.mvp === 'Duplicated' ? dupOf : '',
      },
      comment.trim(),
    );
  }

  return (
    <div
      className={'modal-back' + (open ? ' open' : '')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-x" type="button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          {err && <div className="modal-err show">{err}</div>}

          {showComment && (
            <div className="frow one">
              <div className="fld">
                <label>Comment (optional)</label>
                <input
                  type="text"
                  placeholder="What changed in this version… (like a commit message)"
                  autoComplete="off"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="frow">
            <div className="fld">
              <label>
                Pillar <span className="req">*</span>
              </label>
              <input
                type="text"
                list="pillar-list"
                placeholder="e.g. Homepage, or a new one"
                autoComplete="off"
                value={form.pillar}
                onChange={(e) => set('pillar', e.target.value)}
                onBlur={(e) => {
                  const layer = layerOfPillar(e.target.value.trim());
                  if (e.target.value.trim()) set('layer', layer);
                }}
              />
              <datalist id="pillar-list">
                {pillars.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div className="fld">
              <label>
                Layer <span className="req">*</span>
              </label>
              <select value={form.layer} onChange={(e) => set('layer', e.target.value as Layer)}>
                {LAYERS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="frow one">
            <div className="fld">
              <label>
                Check (metric name) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cookie banner appears on first visit"
                autoComplete="off"
                value={form.check}
                onChange={(e) => set('check', e.target.value)}
              />
            </div>
          </div>

          <div className="frow one">
            <div className="fld">
              <label>Plain English</label>
              <textarea
                placeholder="What this means in everyday terms…"
                value={form.plainEnglish}
                onChange={(e) => set('plainEnglish', e.target.value)}
              />
            </div>
          </div>

          <div className="frow one">
            <div className="fld">
              <label>How (URL-only)</label>
              <textarea
                placeholder="Recommended delivery path first, then alternatives…"
                value={form.how}
                onChange={(e) => set('how', e.target.value)}
              />
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>
                Source <span className="req">*</span>
              </label>
              <input
                type="text"
                list="source-list"
                placeholder="e.g. Snurra QA, or your own"
                autoComplete="off"
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
              />
              <datalist id="source-list">
                <option value="Snurra QA" />
                <option value="Presales" />
                <option value="Spectera" />
              </datalist>
            </div>
            <div className="fld">
              <label>Feasibility</label>
              <select value={form.bucket} onChange={(e) => set('bucket', e.target.value as BucketKey)}>
                {BUCKET_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {BUCKETS[k].icon} {BUCKETS[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>Effort</label>
              <select value={form.effort} onChange={(e) => set('effort', e.target.value as Effort)}>
                <option>Live</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div className="fld">
              <label>Phase</label>
              <select value={form.phase} onChange={(e) => set('phase', e.target.value as Phase)}>
                <option value="A">A · URL-only</option>
                <option value="B">B · needs access</option>
              </select>
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>MVP</label>
              <select value={form.mvp} onChange={(e) => set('mvp', e.target.value as Mvp)}>
                <option value="MVP">MVP</option>
                <option value="Post-MVP">Post-MVP</option>
                <option value="Duplicated">Duplicated</option>
              </select>
            </div>
            <div className="fld">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value as Prio)}>
                <option value="">—</option>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="frow">
            <div className="fld fld-check">
              <input type="checkbox" id="m-hero" checked={form.hero} onChange={(e) => set('hero', e.target.checked)} />
              <label htmlFor="m-hero">🔶 Hero — demo-able “early findings” item</label>
            </div>
          </div>

          {form.mvp === 'Duplicated' && (
            <div className="frow one">
              <div className="fld">
                <label>
                  Duplicate of (Check name) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cookie banner appears on first visit"
                  autoComplete="off"
                  value={form.dupOf}
                  onChange={(e) => set('dupOf', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          {showDelete && onDelete && (
            <button className="btn btn-danger" type="button" onClick={onDelete}>
              Delete version
            </button>
          )}
          <span className="spacer" />
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-add" type="button" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
