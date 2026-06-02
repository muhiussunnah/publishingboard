'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useBoard } from '@/components/Board';
import { TYPE_META } from '@/lib/domain';
import { mondayOf, getWeekNumber, atMidnight, today00 } from '@/lib/format';

const DAY_KEYS = { sv: ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };

export default function WeekView() {
  const { items, getCustomer, openItem, t, lang } = useBoard();
  const [offset, setOffset] = useState(0);

  const days = useMemo(() => {
    const monday = mondayOf(offset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayItems = items.filter((it) => it.starts === iso).sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      return { date: d, iso, items: dayItems, isToday: d.getTime() === today00().getTime() };
    });
  }, [items, offset]);

  const week = getWeekNumber(mondayOf(offset));
  const labels = DAY_KEYS[lang] || DAY_KEYS.sv;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="btn btn-outline !px-2.5"><ChevronLeft size={16} /></button>
          <button onClick={() => setOffset(0)} className="btn btn-outline">{t('week.this')}</button>
          <button onClick={() => setOffset((o) => o + 1)} className="btn btn-outline !px-2.5"><ChevronRight size={16} /></button>
        </div>
        <span className="chip" style={{ background: 'var(--c-pink-soft)', color: 'var(--c-pink-deep)' }}>{t('week.label')} {week}</span>
      </div>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', overflowX: 'auto' }}>
        {days.map((day, i) => (
          <div key={day.iso} className="card p-2.5 min-h-[260px] flex flex-col" style={day.isToday ? { borderColor: 'var(--c-pink)', background: 'var(--c-pink-soft)' } : undefined}>
            <div className="flex items-baseline justify-between px-1 pb-2 mb-1 border-b" style={{ borderColor: 'var(--line)' }}>
              <span className="mono text-[11px] font-semibold uppercase" style={{ color: day.isToday ? 'var(--c-pink-deep)' : 'var(--ink-muted)' }}>{labels[i]}</span>
              <span className="font-display text-[18px]" style={{ color: 'var(--ink)' }}>{day.date.getDate()}</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {day.items.map((it) => {
                const m = TYPE_META[it.type] || {};
                return (
                  <button key={it.id} onClick={() => openItem(it)} className="w-full text-left rounded-lg p-2 transition hover:shadow-sm" style={{ background: m.soft }}>
                    <div className="text-[11px] font-semibold line-clamp-2" style={{ color: m.color }}>{it.title || '—'}</div>
                    <div className="text-[10px] mono mt-0.5 truncate" style={{ color: 'var(--ink-muted)' }}>{getCustomer(it.customerId)?.name || ''}</div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => openItem({ type: 'brevlada', starts: day.iso, ends: day.iso })} className="mt-1.5 w-full grid place-items-center py-1.5 rounded-lg opacity-40 hover:opacity-100 transition" style={{ color: 'var(--ink-muted)' }}>
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
