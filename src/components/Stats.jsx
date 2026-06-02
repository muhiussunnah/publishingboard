'use client';

import { useMemo } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Radio, Users, TrendingUp } from 'lucide-react';
import { useBoard } from '@/components/Board';
import { isOverdue, isLive, fmtMoney } from '@/lib/format';

export default function Stats() {
  const { items, customers, leads, t, lang } = useBoard();

  const s = useMemo(() => {
    const overdue = items.filter(isOverdue).length;
    const pending = items.filter((i) => i.status === 'vantar').length;
    const approved = items.filter((i) => i.status === 'godkand').length;
    const live = items.filter(isLive).length;
    const pipelineValue = leads
      .filter((l) => l.stage !== 'forlorad')
      .reduce((sum, l) => sum + Number(l.value || 0), 0);
    return { overdue, pending, approved, live, customers: customers.length, pipelineValue };
  }, [items, customers, leads]);

  const cards = [
    { key: 'overdue', label: t('stat.overdue'), value: s.overdue, icon: AlertTriangle, color: 'var(--c-red)', bg: 'var(--c-red-soft)', alert: s.overdue > 0 },
    { key: 'pending', label: t('stat.pending'), value: s.pending, icon: Clock, color: 'var(--c-amber)', bg: 'var(--c-amber-soft)' },
    { key: 'approved', label: t('stat.approved'), value: s.approved, icon: CheckCircle2, color: 'var(--c-cyan)', bg: 'var(--c-cyan-soft)' },
    { key: 'live', label: t('stat.live'), value: s.live, icon: Radio, color: 'var(--c-green)', bg: 'var(--c-green-soft)' },
    { key: 'customers', label: t('stat.customers'), value: s.customers, icon: Users, color: 'var(--c-pink-deep)', bg: 'var(--c-pink-soft)' },
    { key: 'pipeline', label: t('stat.pipeline'), value: fmtMoney(s.pipelineValue, lang), icon: TrendingUp, color: 'var(--c-violet)', bg: 'var(--c-violet-soft)', wide: true },
  ];

  return (
    <div className="grid gap-3 pt-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.key} className="card card-hover p-4 flex items-center gap-3.5" style={c.alert ? { borderColor: 'var(--c-red)' } : undefined}>
            <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: c.bg, color: c.color }}>
              <Icon size={19} />
            </span>
            <div className="min-w-0">
              <div className="font-display leading-none truncate" style={{ fontSize: c.wide ? 18 : 26, color: 'var(--ink)' }}>{c.value}</div>
              <div className="text-[11.5px] mt-1 truncate" style={{ color: 'var(--ink-muted)' }}>{c.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
