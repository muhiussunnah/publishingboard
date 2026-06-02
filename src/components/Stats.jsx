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
    const pipelineValue = leads.filter((l) => l.stage !== 'forlorad').reduce((sum, l) => sum + Number(l.value || 0), 0);
    return { overdue, pending, approved, live, customers: customers.length, pipelineValue };
  }, [items, customers, leads]);

  const cards = [
    { key: 'overdue', label: t('stat.overdue'), value: s.overdue, icon: AlertTriangle, tint: 'var(--red)', alert: s.overdue > 0 },
    { key: 'pending', label: t('stat.pending'), value: s.pending, icon: Clock, tint: 'var(--amber)' },
    { key: 'approved', label: t('stat.approved'), value: s.approved, icon: CheckCircle2, tint: 'var(--cyan)' },
    { key: 'live', label: t('stat.live'), value: s.live, icon: Radio, tint: 'var(--green)', grad: true },
    { key: 'customers', label: t('stat.customers'), value: s.customers, icon: Users, tint: 'var(--pink-600)' },
    { key: 'pipeline', label: t('stat.pipeline'), value: fmtMoney(s.pipelineValue, lang), icon: TrendingUp, tint: 'var(--violet)', grad: true, wide: true },
  ];

  return (
    <div className="grid gap-3 pt-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}>
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.key} className="card card-hover p-4 relative overflow-hidden" style={c.alert ? { boxShadow: '0 0 0 1.5px var(--red-bg), var(--shadow-xs)' } : undefined}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium" style={{ color: 'var(--muted)' }}>{c.label}</span>
              <Icon size={15} style={{ color: c.alert ? 'var(--red)' : 'var(--faint)' }} strokeWidth={2.2} />
            </div>
            <div
              className={`font-display mt-2.5 tracking-tight2 ${c.grad ? 'grad-text' : ''}`}
              style={{ fontSize: c.wide ? 21 : 30, lineHeight: 1, color: c.grad ? undefined : (c.alert ? 'var(--red)' : 'var(--ink)') }}
            >
              {c.value}
            </div>
            {c.alert && <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--red)' }} />}
          </div>
        );
      })}
    </div>
  );
}
