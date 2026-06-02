'use client';

import { useMemo, useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import { useBoard } from '@/components/Board';
import ItemCard from '@/components/cards/ItemCard';
import { CardGrid, EmptyState } from '@/components/ui/Bits';
import { ITEM_TYPES, ITEM_STATUSES } from '@/lib/domain';

export default function ListView() {
  const { items, getCustomer, t } = useBoard();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => (type ? i.type === type : true))
      .filter((i) => (status ? i.status === status : true))
      .filter((i) => {
        if (!needle) return true;
        const cust = getCustomer(i.customerId)?.name || '';
        return [i.title, i.description, i.caption, i.city, i.to, cust].filter(Boolean).join(' ').toLowerCase().includes(needle);
      })
      .sort((a, b) => (a.starts || '').localeCompare(b.starts || ''));
  }, [items, type, status, q, getCustomer]);

  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} className="chip transition" style={{ background: active ? 'var(--ink)' : 'var(--bg-2)', color: active ? '#fff' : 'var(--ink-soft)' }}>{children}</button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-muted)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('action.search')} className="field-input !pl-9" />
        </div>
        <div className="flex items-center gap-1.5">
          <Chip active={!type} onClick={() => setType('')}>{t('list.filterAll')}</Chip>
          {ITEM_TYPES.map((ty) => <Chip key={ty} active={type === ty} onClick={() => setType(ty)}>{t(`type.${ty}`)}</Chip>)}
        </div>
        <div className="flex items-center gap-1.5">
          <Chip active={!status} onClick={() => setStatus('')}>{t('list.filterStatus')}</Chip>
          {ITEM_STATUSES.map((st) => <Chip key={st} active={status === st} onClick={() => setStatus(st)}>{t(`status.${st}`)}</Chip>)}
        </div>
      </div>

      {filtered.length ? <CardGrid>{filtered.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
        : <EmptyState icon={Inbox} title={t('list.empty')} />}
    </div>
  );
}
