'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

const TABS = [
  ['today', 'nav.today'], ['week', 'nav.week'], ['customers', 'nav.customers'],
  ['events', 'nav.events'], ['cities', 'nav.cities'], ['library', 'nav.library'],
  ['pipeline', 'nav.pipeline'], ['list', 'nav.list'],
];

export default function Tabs({ view, setView, counts }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 border-b overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-6 min-w-max">
        {TABS.map(([key, label]) => {
          const active = view === key;
          const badge = counts[key];
          return (
            <button key={key} className="tab" data-active={active} onClick={() => setView(key)}>
              {t(label)}
              {badge != null && badge > 0 && <span className="tab-badge">{badge}</span>}
              {active && (
                <motion.span layoutId="tab-underline" className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-full" style={{ background: 'var(--c-pink)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
