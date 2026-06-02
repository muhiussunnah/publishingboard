'use client';

import { useMemo, useState } from 'react';
import { MapPin, Map as MapIcon } from 'lucide-react';
import { useBoard } from '@/components/Board';
import ItemCard from '@/components/cards/ItemCard';
import { CardGrid, EmptyState } from '@/components/ui/Bits';
import { TYPE_META } from '@/lib/domain';

export default function CitiesView() {
  const { items, t } = useBoard();
  const [active, setActive] = useState(null);

  const cities = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const c = it.city || '—';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(it);
    }
    return [...map.entries()].map(([city, list]) => ({ city, list })).sort((a, b) => b.list.length - a.list.length);
  }, [items]);

  if (!cities.length) return <EmptyState icon={MapIcon} title={t('cities.empty')} />;

  const current = cities.find((c) => c.city === active);

  return (
    <div className="space-y-6">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {cities.map(({ city, list }) => {
          const counts = list.reduce((acc, it) => ((acc[it.type] = (acc[it.type] || 0) + 1), acc), {});
          const isActive = active === city;
          return (
            <button
              key={city}
              onClick={() => setActive(isActive ? null : city)}
              className="card card-hover p-4 text-left"
              style={isActive ? { borderColor: 'var(--c-pink)', boxShadow: 'var(--ring)' } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid place-items-center w-9 h-9 rounded-xl shrink-0" style={{ background: 'var(--c-pink-soft)', color: 'var(--c-pink-deep)' }}><MapPin size={17} /></span>
                  <span className="font-display text-[17px] truncate" style={{ color: 'var(--ink)' }}>{city}</span>
                </div>
                <span className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>{list.length}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {Object.entries(counts).map(([ty, n]) => (
                  <span key={ty} className="chip" style={{ background: TYPE_META[ty]?.soft, color: TYPE_META[ty]?.color }}>{t(`type.${ty}`)} {n}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="pt-2">
          <div className="flex items-center gap-2.5 mb-3.5">
            <span className="w-1.5 h-5 rounded-full" style={{ background: 'var(--c-pink)' }} />
            <h2 className="font-display text-[20px]" style={{ color: 'var(--ink)' }}>{current.city}</h2>
            <span className="chip" style={{ background: 'var(--bg-2)', color: 'var(--ink-muted)' }}>{current.list.length} {t('cities.count')}</span>
          </div>
          <CardGrid>{current.list.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
        </div>
      )}
    </div>
  );
}
