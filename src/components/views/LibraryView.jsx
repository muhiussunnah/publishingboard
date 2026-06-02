'use client';

import { useMemo, useState } from 'react';
import { Film, Plus, Search, ExternalLink, User, Pencil } from 'lucide-react';
import { useBoard } from '@/components/Board';
import { EmptyState } from '@/components/ui/Bits';
import { CategoryBadge } from '@/components/ui/Badge';
import { VIDEO_CATEGORIES } from '@/lib/domain';
import { fmtDate } from '@/lib/format';

export default function LibraryView() {
  const { videos, openVideo, t, lang } = useBoard();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return videos
      .filter((v) => (cat ? v.category === cat : true))
      .filter((v) => !needle || [v.number, v.name, v.description, v.category].filter(Boolean).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [videos, q, cat]);

  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} className="chip transition" style={{ background: active ? 'var(--ink)' : 'var(--bg-2)', color: active ? '#fff' : 'var(--ink-soft)' }}>{children}</button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-muted)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('library.pick.search')} className="field-input !pl-9" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Chip active={!cat} onClick={() => setCat('')}>{t('action.all')}</Chip>
          {VIDEO_CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{t(`cat.${c}`)}</Chip>)}
        </div>
        <button onClick={() => openVideo()} className="btn btn-pink"><Plus size={16} /> {t('action.newVideo')}</button>
      </div>

      {filtered.length ? (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map((v) => (
            <button key={v.id} onClick={() => openVideo(v)} className="card card-hover p-0 text-left group overflow-hidden">
              <div className="h-24 flex items-center justify-between px-4" style={{ background: 'linear-gradient(135deg, var(--c-violet-soft), var(--bg-2))' }}>
                <span className="mono text-[13px] font-bold" style={{ color: 'var(--c-violet)' }}>{v.number}</span>
                <Film size={28} style={{ color: 'var(--c-violet)', opacity: 0.65 }} />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <CategoryBadge category={v.category} />
                  <Pencil size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--ink-muted)' }} />
                </div>
                <h3 className="font-display text-[16px] mt-2 line-clamp-2 group-hover:text-[var(--c-pink-deep)] transition-colors" style={{ color: 'var(--ink)' }}>{v.name}</h3>
                {v.description && <p className="text-[12.5px] mt-1 line-clamp-2" style={{ color: 'var(--ink-soft)' }}>{v.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-[11.5px] mono" style={{ borderColor: 'var(--line)', color: 'var(--ink-muted)' }}>
                  <span className="flex items-center gap-1"><User size={11} /> {v.producer || '—'}</span>
                  <span>{fmtDate(v.date, lang)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon={Film} title={t('library.empty')} />
      )}
    </div>
  );
}
