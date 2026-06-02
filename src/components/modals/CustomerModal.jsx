'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FormRow, Field, Input, Textarea, Select } from '@/components/ui/Field';
import { useBoard } from '@/components/Board';
import { PACKAGES } from '@/lib/domain';

const empty = { name: '', package: 'standard', mailboxCount: 12, videoCount: 0, type: 'lokal' };

export default function CustomerModal({ record, onClose }) {
  const { ctypes, team, saveCustomer, deleteCustomer, t } = useBoard();
  const [form, setForm] = useState(empty);

  useEffect(() => { if (record) setForm({ ...empty, ...record }); }, [record]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = Boolean(form.id);

  const submit = async () => {
    await saveCustomer({ ...form, value: Number(form.value || 0), mailboxCount: Number(form.mailboxCount || 0), videoCount: Number(form.videoCount || 0) });
    onClose();
  };
  const onDelete = async () => { if (confirm(t('modal.confirmDelete'))) { await deleteCustomer(form.id); onClose(); } };

  const typeOptions = ctypes.map((c) => ({ value: c, label: t(`ctype.${c}`) }));
  const pkgOptions = PACKAGES.map((p) => ({ value: p, label: t(`pkg.${p}`) }));
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
    <Modal open={Boolean(record)} onClose={onClose} title={isEdit ? t('modal.editCustomer') : t('modal.newCustomer')} footer={footer}>
      <FormRow>
        <Field label={t('field.company')}><Input value={form.name} onChange={set('name')} placeholder="Pizzeria Berga" /></Field>
        <Field label={t('field.contact')}><Input value={form.contact} onChange={set('contact')} placeholder="Marco · 070-…" /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.type')}><Select value={form.type} onChange={set('type')} options={typeOptions} placeholder={`– ${t('field.type')} –`} /></Field>
        <Field label={t('field.package')}><Select value={form.package} onChange={set('package')} options={pkgOptions} /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.mailboxCount')}><Input type="number" value={form.mailboxCount} onChange={set('mailboxCount')} /></Field>
        <Field label={t('field.value')}><Input type="number" value={form.value} onChange={set('value')} placeholder="10600" /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.videoCount')}><Input type="number" value={form.videoCount} onChange={set('videoCount')} /></Field>
        <Field label={t('customers.contract')}><Input type="date" value={form.startDate} onChange={set('startDate')} /></Field>
      </FormRow>
      <FormRow>
        <Field label={t('field.city')}><Input value={form.city} onChange={set('city')} placeholder="Täby" /></Field>
        <Field label={t('field.owner')}><Select value={form.owner} onChange={set('owner')} options={ownerOptions} placeholder={`– ${t('field.owner')} –`} /></Field>
      </FormRow>
      <Field label={t('field.link')} full><Input type="url" value={form.link} onChange={set('link')} placeholder="https://…" /></Field>
      <Field label={t('field.note')} full><Textarea value={form.note} onChange={set('note')} /></Field>
    </Modal>
  );
}
