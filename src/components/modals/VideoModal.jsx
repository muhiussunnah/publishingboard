'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FormRow, Field, Input, Textarea, Select } from '@/components/ui/Field';
import { useBoard } from '@/components/Board';
import { VIDEO_CATEGORIES } from '@/lib/domain';

const empty = { category: 'plats', producer: 'Tayyab', name: '' };

export default function VideoModal({ record, onClose }) {
  const { videos, saveVideo, deleteVideo, t } = useBoard();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (record) {
      const nextNum = `V-${String(videos.length + 1).padStart(3, '0')}`;
      setForm({ ...empty, number: record.id ? record.number : nextNum, ...record });
    }
  }, [record, videos.length]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = Boolean(form.id);

  const submit = async () => { await saveVideo(form); onClose(); };
  const onDelete = async () => { if (confirm(t('modal.confirmDelete'))) { await deleteVideo(form.id); onClose(); } };

  const catOptions = VIDEO_CATEGORIES.map((c) => ({ value: c, label: t(`cat.${c}`) }));

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
    <Modal open={Boolean(record)} onClose={onClose} title={isEdit ? t('modal.editVideo') : t('modal.newVideo')} maxWidth={560} footer={footer}>
      <FormRow>
        <Field label={t('field.number')}><Input value={form.number} onChange={set('number')} placeholder="V-001" /></Field>
        <Field label={t('field.category')}><Select value={form.category} onChange={set('category')} options={catOptions} /></Field>
      </FormRow>
      <Field label={t('field.name')} full><Input value={form.name} onChange={set('name')} placeholder="Knattefotboll Hellasgården" /></Field>
      <Field label={t('field.description')} full><Textarea value={form.description} onChange={set('description')} /></Field>
      <Field label={t('field.videoUrl')} full><Input type="url" value={form.link} onChange={set('link')} placeholder="https://drive.google.com/…" /></Field>
      <FormRow>
        <Field label={t('field.producer')}><Input value={form.producer} onChange={set('producer')} /></Field>
        <Field label={t('field.date')}><Input type="date" value={form.date} onChange={set('date')} /></Field>
      </FormRow>
      <Field label={t('field.note')} full><Textarea value={form.note} onChange={set('note')} /></Field>
    </Modal>
  );
}
