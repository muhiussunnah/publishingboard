'use client';

import { Mail, Video, CalendarHeart, MapPin, ArrowUpRight, ChevronRight, Trash2, Clock } from 'lucide-react';
import { useBoard } from '@/components/Board';
import { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { TYPE_META, nextStatus } from '@/lib/domain';
import { fmtDate, ageLabel, isOverdue } from '@/lib/format';

const ICON = { brevlada: Mail, video: Video, event: CalendarHeart };

export default function ItemCard({ item }) {
  const { getCustomer, openItem, setItemStatus, deleteItem, t, lang } = useBoard();
  const customer = getCustomer(item.customerId);
  const Icon = ICON[item.type] || Mail;
  const meta = TYPE_META[item.type] || {};
  const overdue = isOverdue(item);
  const canAdvance = item.status !== 'publicerad';

  return (
    <div className="card card-hover p-4 group relative pop-in" style={overdue ? { borderColor: 'var(--c-red)' } : undefined}>
      {overdue && (
        <span className="absolute -top-2 left-4 chip" style={{ background: 'var(--c-red)', color: '#fff' }}>
          <Clock size={11} /> {t('today.overdue')}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl shrink-0" style={{ background: meta.soft, color: meta.color }}>
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink-soft)' }}>{customer?.name || t('misc.uncategorized')}</div>
            <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              {item.city && (<><MapPin size={11} /> {item.city}</>)}
            </div>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <button onClick={() => openItem(item)} className="text-left w-full mt-3">
        <h3 className="font-display text-[18px] leading-snug line-clamp-2 transition-colors group-hover:text-[var(--c-pink-deep)]" style={{ color: 'var(--ink)' }}>
          {item.title || <span style={{ color: 'var(--ink-muted)' }} className="italic">{t('field.title')}…</span>}
        </h3>
        {(item.description || item.caption) && (
          <p className="text-[13px] mt-1.5 line-clamp-2" style={{ color: 'var(--ink-soft)' }}>{item.description || item.caption}</p>
        )}
      </button>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11.5px] mono" style={{ color: 'var(--ink-muted)' }}>
        <span>{fmtDate(item.starts, lang)} → {fmtDate(item.ends, lang)}</span>
        <span>·</span>
        <span>{ageLabel(item, t)}</span>
        {item.to && (<><span>·</span><span className="truncate max-w-[160px]">{item.to}</span></>)}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-1">
          <TypeBadge type={item.type} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className="btn btn-ghost !px-2 !py-1.5" title={item.link}>
              <ArrowUpRight size={15} />
            </a>
          )}
          <button onClick={() => deleteItem(item.id)} className="btn btn-ghost !px-2 !py-1.5" title={t('action.delete')}>
            <Trash2 size={15} />
          </button>
          {canAdvance && (
            <button onClick={() => setItemStatus(item.id, nextStatus(item.status))} className="btn btn-green !py-1.5 !px-2.5" title={t('action.advance')}>
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
