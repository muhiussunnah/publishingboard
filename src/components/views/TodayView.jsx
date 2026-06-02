'use client';

import { useMemo } from 'react';
import { PartyPopper } from 'lucide-react';
import { useBoard } from '@/components/Board';
import ItemCard from '@/components/cards/ItemCard';
import { SectionTitle, CardGrid, EmptyState } from '@/components/ui/Bits';
import { isOverdue, isToday, isUpcoming } from '@/lib/format';

export default function TodayView() {
  const { items, t } = useBoard();

  const { overdue, todo, upcoming } = useMemo(() => {
    const active = items.filter((i) => i.status !== 'publicerad');
    return {
      overdue: active.filter(isOverdue),
      todo: active.filter((i) => isToday(i) && !isOverdue(i)),
      upcoming: items.filter((i) => isUpcoming(i, 7) && !isToday(i)),
    };
  }, [items]);

  const nothing = overdue.length === 0 && todo.length === 0 && upcoming.length === 0;
  if (nothing) return <EmptyState icon={PartyPopper} title={t('today.empty')} />;

  return (
    <div className="space-y-8">
      {overdue.length > 0 && (
        <section>
          <SectionTitle accent="var(--c-red)" count={overdue.length}>{t('today.overdue')}</SectionTitle>
          <CardGrid>{overdue.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
        </section>
      )}
      <section>
        <SectionTitle count={todo.length}>{t('today.todo')}</SectionTitle>
        {todo.length ? <CardGrid>{todo.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
          : <EmptyState icon={PartyPopper} title={t('today.empty')} />}
      </section>
      {upcoming.length > 0 && (
        <section>
          <SectionTitle accent="var(--c-green)" count={upcoming.length}>{t('today.upcoming')}</SectionTitle>
          <CardGrid>{upcoming.map((i) => <ItemCard key={i.id} item={i} />)}</CardGrid>
        </section>
      )}
    </div>
  );
}
