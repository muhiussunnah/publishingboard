'use client';

import { useMemo } from 'react';
import { Users, Plus, Mail, Video, MapPin, Pencil } from 'lucide-react';
import { useBoard } from '@/components/Board';
import { EmptyState } from '@/components/ui/Bits';
import { fmtMoney, fmtDate } from '@/lib/format';

export default function CustomersView() {
  const { customers, items, openCustomer, t, lang } = useBoard();

  const withCounts = useMemo(() =>
    customers.map((c) => ({
      ...c,
      pubs: items.filter((i) => i.customerId === c.id).length,
    })).sort((a, b) => b.value - a.value),
  [customers, items]);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => openCustomer()} className="btn btn-pink"><Plus size={16} /> {t('action.newCustomer')}</button>
      </div>

      {withCounts.length ? (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {withCounts.map((c) => {
            const initial = (c.name?.[0] || '?').toUpperCase();
            return (
              <button key={c.id} onClick={() => openCustomer(c)} className="card card-hover p-4 text-left group">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0 font-display text-[18px] text-white" style={{ background: 'linear-gradient(135deg, var(--c-pink), var(--c-pink-deep))' }}>{initial}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-[17px] truncate group-hover:text-[var(--c-pink-deep)] transition-colors" style={{ color: 'var(--ink)' }}>{c.name}</h3>
                      <Pencil size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--ink-muted)' }} />
                    </div>
                    {c.contact && <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--ink-muted)' }}>{c.contact}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {c.type && <span className="chip" style={{ background: 'var(--c-green-soft)', color: 'var(--c-green)' }}>{t(`ctype.${c.type}`)}</span>}
                      {c.city && <span className="text-[11.5px] mono flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}><MapPin size={11} /> {c.city}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                  <Metric icon={Mail} value={c.mailboxCount || 0} label={t('customers.mailboxes')} />
                  <Metric icon={Video} value={c.videoCount || 0} label={t('customers.videos')} />
                  <div>
                    <div className="font-display text-[16px]" style={{ color: 'var(--ink)' }}>{c.pubs}</div>
                    <div className="text-[10.5px] mono" style={{ color: 'var(--ink-muted)' }}>{t('customers.publications')}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[12px]">
                  <span className="mono" style={{ color: 'var(--ink-muted)' }}>{fmtDate(c.startDate, lang)}</span>
                  <span className="font-semibold" style={{ color: 'var(--c-green)' }}>{fmtMoney(c.value, lang)}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title={t('customers.empty')} />
      )}
    </div>
  );
}

function Metric({ icon: Icon, value, label }) {
  return (
    <div>
      <div className="flex items-center gap-1 font-display text-[16px]" style={{ color: 'var(--ink)' }}><Icon size={13} style={{ color: 'var(--ink-muted)' }} /> {value}</div>
      <div className="text-[10.5px] mono" style={{ color: 'var(--ink-muted)' }}>{label}</div>
    </div>
  );
}
