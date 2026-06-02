'use client';

import { useEffect, useState } from 'react';
import { Mail, Video, CalendarHeart, Film, Upload, Trash2, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FormRow, Field, Input, Textarea, Select, Toggle } from '@/components/ui/Field';
import { useBoard } from '@/components/Board';
import { ITEM_TYPES, ITEM_STATUSES, TYPE_META } from '@/lib/domain';

const ICON = { brevlada: Mail, video: Video, event: CalendarHeart };
const empty = { type: 'brevlada', status: 'utkast', ageAll: true, title: '', description: '' };

export default function ItemModal({ seed, onClose }) {
  const { customers, videos, getCustomer, saveItem, deleteItem, t } = useBoard();
  const [form, setForm] = useState(empty);
  const [picker, setPicker] = useState(false);
  const [pq, setPq] = useState('');

  useEffect(() => {
    if (seed) setForm({ ...empty, ...seed });
  }, [seed]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = Boolean(form.id);
  const type = form.type || 'brevlada';

  const submit = async () => {
    await saveItem(form);
    onClose();
  };
  const onDelete = async () => {
    if (confirm(t('modal.confirmDelete'))) { await deleteItem(form.id); onClose(); }
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('image')(reader.result);
    reader.readAsDataURL(file);
  };

  const pickVideo = (v) => {
    setForm((f) => ({ ...f, title: f.title || v.name, caption: f.caption || v.description, videoUrl: v.link, link: f.link || v.link }));
    setPicker(false);
  };

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
  const statusOptions = ITEM_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }));
  const filteredVideos = videos.filter((v) => !pq || [v.number, v.name, v.category].join(' ').toLowerCase().includes(pq.toLowerCase()));

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
    <Modal open={Boolean(seed)} onClose={onClose} title={isEdit ? t('modal.editItem') : t('modal.newItem')} subtitle={getCustomer(form.customerId)?.name} footer={footer}>
      {/* type segmented control */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl mb-5" style={{ background: 'var(--bg-2)' }}>
        {ITEM_TYPES.map((ty) => {
          const Icon = ICON[ty]; const active = type === ty; const m = TYPE_META[ty];
          return (
            <button key={ty} onClick={() => set('type')(ty)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition"
              style={active ? { background: '#fff', color: m.color, boxShadow: 'var(--shadow-sm)' } : { color: 'var(--ink-muted)' }}>
              <Icon size={16} /> {t(`type.${ty}`)}
            </button>
          );
        })}
      </div>

      <FormRow>
        <Field label={t('field.customer')}>
          <Select value={form.customerId} onChange={set('customerId')} options={customerOptions} placeholder={`– ${t('field.customer')} –`} />
        </Field>
        <Field label={t('field.status')}>
          <Select value={form.status} onChange={set('status')} options={statusOptions} />
        </Field>
      </FormRow>

      {type === 'video' && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--c-violet-soft)' }}>
          <button onClick={() => setPicker((p) => !p)} className="btn btn-outline w-full"><Film size={15} /> {t('action.pick')}</button>
          {picker && (
            <div className="mt-3">
              <div className="relative mb-2">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-muted)' }} />
                <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder={t('library.pick.search')} className="field-input !pl-8 !py-2 text-[13px]" />
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1.5">
                {filteredVideos.map((v) => (
                  <button key={v.id} onClick={() => pickVideo(v)} className="w-full text-left p-2 rounded-lg bg-white hover:shadow-sm transition flex items-center gap-2">
                    <span className="mono text-[11px] font-bold" style={{ color: 'var(--c-violet)' }}>{v.number}</span>
                    <span className="text-[12.5px] truncate" style={{ color: 'var(--ink)' }}>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Field label={t('field.title')} full>
        <Input value={form.title} onChange={set('title')} placeholder={t('misc.placeholderTitle')} />
      </Field>

      {type === 'video' ? (
        <>
          <Field label={t('field.caption')} full><Input value={form.caption} onChange={set('caption')} /></Field>
          <Field label={t('field.videoUrl')} full><Input type="url" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://drive.google.com/…" /></Field>
        </>
      ) : (
        <Field label={t('field.description')} full><Textarea value={form.description} onChange={set('description')} /></Field>
      )}

      {type === 'event' && (
        <>
          <FormRow>
            <Field label={t('field.arrangor')}><Input value={form.arrangor} onChange={set('arrangor')} /></Field>
            <Field label={t('field.address')}><Input value={form.address} onChange={set('address')} /></Field>
          </FormRow>
          <Field label={t('field.image')} full>
            <div className="flex items-center gap-3">
              <label className="btn btn-outline cursor-pointer"><Upload size={15} /> {t('field.image')}<input type="file" accept="image/*" onChange={onImage} hidden /></label>
              {form.image && <img src={form.image} alt="" className="h-12 rounded-lg object-cover" />}
            </div>
          </Field>
        </>
      )}

      <FormRow>
        <Field label={t('field.city')}><Input value={form.city} onChange={set('city')} placeholder="Täby" /></Field>
        <Field label={t('field.to')}><Input value={form.to} onChange={set('to')} placeholder="Täby + Danderyd" /></Field>
      </FormRow>

      <div className="mb-4">
        <label className="field-label">{t('age.allLabel')}</label>
        <div className="flex items-center gap-4 flex-wrap">
          <Toggle checked={!!form.ageAll} onChange={(v) => setForm((f) => ({ ...f, ageAll: v }))} label={t('age.all')} />
          {!form.ageAll && (
            <div className="flex items-center gap-2">
              <Input type="number" value={form.ageFrom ?? ''} onChange={set('ageFrom')} placeholder={t('age.from')} style={{ width: 110 }} />
              <span style={{ color: 'var(--ink-muted)' }}>–</span>
              <Input type="number" value={form.ageTo ?? ''} onChange={set('ageTo')} placeholder={t('age.to')} style={{ width: 110 }} />
            </div>
          )}
        </div>
      </div>

      <Field label={t('field.link')} full><Input type="url" value={form.link} onChange={set('link')} placeholder="https://…" /></Field>

      <FormRow>
        <Field label={t('field.start')}><Input type="date" value={form.starts} onChange={set('starts')} /></Field>
        <Field label={t('field.end')}><Input type="date" value={form.ends} onChange={set('ends')} /></Field>
      </FormRow>

      <Field label={t('field.note')} full><Textarea value={form.note} onChange={set('note')} /></Field>
    </Modal>
  );
}
