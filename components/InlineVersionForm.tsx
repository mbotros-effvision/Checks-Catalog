'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { CheckInput, Effort, Mvp, Prio } from '@/types';
import { Button } from './ui/button';

export interface InlineVersionFormProps {
  title: string; // e.g. 'New version (v3)' | 'Edit v2'
  initial: CheckInput;
  initialComment: string;
  onSave: (input: CheckInput, comment: string) => void;
  onCancel: () => void;
}

export function InlineVersionForm({ title, initial, initialComment, onSave, onCancel }: InlineVersionFormProps) {
  const [form, setForm] = useState<CheckInput>(initial);
  const [comment, setComment] = useState(initialComment);
  const [err, setErr] = useState('');

  function set<K extends keyof CheckInput>(key: K, value: CheckInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const pillar = form.pillar.trim();
    const check = form.check.trim();
    const source = form.source.trim();
    const dupOf = form.dupOf.trim();
    if (!pillar || !check || !source) {
      setErr('Pillar, Check and Source are required.');
      return;
    }
    if (form.mvp === 'Duplicated' && !dupOf) {
      setErr('Enter the Check name this is duplicated from.');
      return;
    }
    onSave(
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
    <div className="ivf">
      <div className="ivf-head">
        <span className="ivf-title">{title}</span>
        {err && <span className="ivf-err">{err}</span>}
      </div>

      <div className="ivf-grid">
        <label className="ivf-field ivf-span2">
          <span>Comment (optional)</span>
          <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What changed…" />
        </label>

        <label className="ivf-field ivf-span2">
          <span>Pillar *</span>
          <input type="text" list="pillar-list" value={form.pillar} onChange={(e) => set('pillar', e.target.value)} />
        </label>

        <label className="ivf-field ivf-span2">
          <span>Check *</span>
          <input type="text" value={form.check} onChange={(e) => set('check', e.target.value)} />
        </label>

        <label className="ivf-field ivf-span2">
          <span>Plain English</span>
          <textarea value={form.plainEnglish} onChange={(e) => set('plainEnglish', e.target.value)} />
        </label>

        <label className="ivf-field ivf-span2">
          <span>How</span>
          <textarea value={form.how} onChange={(e) => set('how', e.target.value)} placeholder="How to deliver this check…" />
        </label>

        <label className="ivf-field">
          <span>Source *</span>
          <input type="text" list="source-list" value={form.source} onChange={(e) => set('source', e.target.value)} />
        </label>
        <label className="ivf-field">
          <span>Effort</span>
          <select value={form.effort} onChange={(e) => set('effort', e.target.value as Effort)}>
            <option>Live</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option value="N/A">N/A</option>
          </select>
        </label>

        <label className="ivf-field">
          <span>MVP</span>
          <select value={form.mvp} onChange={(e) => set('mvp', e.target.value as Mvp)}>
            <option value="MVP">MVP</option>
            <option value="Post-MVP">Post-MVP</option>
            <option value="Duplicated">Duplicated</option>
          </select>
        </label>
        <label className="ivf-field">
          <span>Priority</span>
          <select value={form.priority} onChange={(e) => set('priority', e.target.value as Prio)}>
            <option value="">—</option>
            <option value="high">High</option>
            <option value="med">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        {form.mvp === 'Duplicated' && (
          <label className="ivf-field ivf-span2">
            <span>Duplicate of (Check name) *</span>
            <input type="text" value={form.dupOf} onChange={(e) => set('dupOf', e.target.value)} />
          </label>
        )}
      </div>

      <div className="ivf-actions">
        <Button variant="default" size="default" onClick={handleSave}>
          <Save size={14} aria-hidden /> Save version
        </Button>
        <Button variant="ghost" size="default" onClick={onCancel}>
          <X size={14} aria-hidden /> Cancel
        </Button>
      </div>

      <datalist id="pillar-list" />
      <datalist id="source-list">
        <option value="Snurra QA" />
        <option value="Presales" />
        <option value="Spectera" />
      </datalist>
    </div>
  );
}
