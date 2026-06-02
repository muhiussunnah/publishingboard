'use client';

import { useMemo } from 'react';
import { CalendarHeart } from 'lucide-react';
import { useBoard } from '@/components/Board';
import ItemCard from '@/components/cards/ItemCard';
import { SectionTitle, CardGrid, EmptyState } from '@/components/ui/Bits';
import { today00, atMidnight } from '@/lib/format';

export default function EventsView() {
  const { items, t } = useBoard();
  const events = useMemo(
    () => items.filter((i) => i.type === 'event').sort((a, b) => (a.starts || '').localeCompare(b.starts || '')),
    [items]
  );
  if (!events.length) return <EmptyState icon={CalendarHeart} title={t('events.empty')} />;

  const now = today00();
  const upcoming = events.filter((e) => !e.starts || atMidnight(e.starts) >= now);
  const past = events.filter((e) => e.starts && atMidnight(e.starts) < now);

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle accent="var(--c-green)" count={upcoming.length}>{t('events.upcoming')}</SectionTitle>
        {upcoming.length ? <CardGrid>{upcoming.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
          : <EmptyState icon={CalendarHeart} title={t('events.empty')} />}
      </section>
      {past.length > 0 && (
        <section className="opacity-75">
          <SectionTitle accent="var(--ink-muted)" count={past.length}>{t('nav.events')}</SectionTitle>
          <CardGrid>{past.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
        </section>
      )}
    </div>
  );
}
