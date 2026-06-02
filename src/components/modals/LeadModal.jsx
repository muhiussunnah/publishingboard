'use client';

import { useEffect, useState } from 'react';
import { Trash2, Send, MessageSquare } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FormRow, Field, Input, Textarea, Select } from '@/components/ui/Field';
import { useBoard } from '@/components/Board';
import { LEAD_STAGES } from '@/lib/domain';
import { fmtDate } from '@/lib/format';

const empty = { stage: 'ny', type: 'lokal', dialog: [] };

export default function LeadModal({ record, onClose }) {
  const { ctypes, team, saveLead, deleteLead, t, lang } = useBoard();
  const [form, setForm] = useState(empty);
  const [note, setNote] = useState('');

  useEffect(() => { if (record) setForm({ ...empty, dialog: [], ...record }); }, [record]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = Boolean(form.id);

  const submit = async () => { await saveLead({ ...form, value: Number(form.value || 0) }); onClose(); };
  const onDelete = async () => { if (confirm(t('modal.confirmDelete'))) { await deleteLead(form.id); onClose(); } };

  const addNote = () => {
    if (!note.trim()) return;
    const entry = { date: new Date().toISOString(), text: note.trim(), by: form.owner || team[0] || '—' };
    setForm((f) => ({ ...f, dialog: [entry, ...(f.dialog || [])] }));
    setNote('');
  };

  const stageOptions = LEAD_STAGES.map((s) => ({ value: s, label: t(`stage.${s}`) }));
  const typeOptions = ctypes.map((c) => ({ value: c, label: t(`ctype.${c}`) }));
  const ownerOptions = team.map((o) => ({ value: o, label: o }));

  const footer = (
    <>
      <div>{isEdit && <button onClick={onDelete} className="btn btn-danger"><Trash2 size={15} /> {t('action.delete')}</button>}</div>
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="btn btn-outline">{t('action.cancel')}</button>
        <button onClick={submit} className="btn btn-primary">{t('action.save')}</button>
      </div>
    </>
  );

  return (
    <Modal open={Boolean(record)} onClose={onClose} title={isEdit ? t('modal.editLead') : t('modal.newLead')} maxWidth={620} footer={footer}>
      <FormRow>
        <Field label={t('field.company')}><Input value={form.company} onChange={set('company')} placeholder="Restaurang Pont" /></Field>
        <Field label={t('field.city')}><Input value={form.city} onChange={set('city')} placeholder="Täby" /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.contact')}><Input value={form.contact} onChange={set('contact')} /></Field>
        <Field label={t('field.phone')}><Input value={form.phone} onChange={set('phone')} /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.owner')}><Select value={form.owner} onChange={set('owner')} options={ownerOptions} placeholder={`– ${t('field.owner')} –`} /></Field>
        <Field label={t('field.stage')}><Select value={form.stage} onChange={set('stage')} options={stageOptions} /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.value')}><Input type="number" value={form.value} onChange={set('value')} placeholder="10600" /></Field>
        <Field label={t('field.type')}><Select value={form.type} onChange={set('type')} options={typeOptions} placeholder={`– ${t('field.type')} –`} /></Field>
      </FormRow>
      <Field label={t('field.source')} full><Input value={form.source} onChange={set('source')} placeholder="Canvas Täby…" /></Field>

      {/* dialogue log */}
      <div className="mt-2">
        <label className="field-label flex items-center gap-1.5"><MessageSquare size={13} /> {t('pipeline.dialog')}</label>
        <div className="flex items-center gap-2 mb-3">
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder={t('pipeline.addNote')} className="field-input" />
          <button onClick={addNote} className="btn btn-green !px-3"><Send size={15} /></button>
        </div>
        <div className="space-y-2 max-h-44 overflow-y-auto">
          {(form.dialog || []).map((d, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: 'var(--bg-2)' }}>
              <p className="text-[13px]" style={{ color: 'var(--ink)' }}>{d.text}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] mono" style={{ color: 'var(--ink-muted)' }}>
                <span>{d.by}</span><span>·</span><span>{fmtDate(d.date, lang)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
