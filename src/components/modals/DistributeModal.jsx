'use client';

import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FormRow, Field, Input } from '@/components/ui/Field';
import { useBoard } from '@/components/Board';
import { todayISO } from '@/lib/format';

export default function DistributeModal({ open, onClose }) {
  const { distribute, t } = useBoard();
  const [form, setForm] = useState({ mailbox: 12, video: 0, months: 12, start: todayISO() });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    await distribute({ mailbox: Number(form.mailbox), video: Number(form.video), months: Number(form.months), start: form.start });
    onClose();
  };

  const footer = (
    <>
      <span className="text-[12px] mono" style={{ color: 'var(--ink-muted)' }}>
        {Number(form.mailbox) + Number(form.video)} {t('customers.publications')}
      </span>
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="btn btn-outline">{t('action.cancel')}</button>
        <button onClick={submit} className="btn btn-primary"><CalendarRange size={15} /> {t('action.create')}</button>
      </div>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={t('modal.distribute')} maxWidth={520} footer={footer}>
      <div className="rounded-xl p-3.5 mb-4 text-[13px]" style={{ background: 'var(--c-green-soft)', color: 'var(--c-green)' }}>
        {t('modal.distribute.info')}
      </div>
      <FormRow>
        <Field label={t('modal.distribute.mailbox')}><Input type="number" value={form.mailbox} onChange={set('mailbox')} /></Field>
        <Field label={t('modal.distribute.video')}><Input type="number" value={form.video} onChange={set('video')} /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.start')}><Input type="date" value={form.start} onChange={set('start')} /></Field>
        <Field label={t('modal.distribute.months')}><Input type="number" value={form.months} onChange={set('months')} /></Field>
      </FormRow>
      <p className="text-[12px] mt-1" style={{ color: 'var(--ink-muted)' }}>{t('modal.distribute.tip')}</p>
    </Modal>
  );
}
