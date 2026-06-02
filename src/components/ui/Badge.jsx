'use client';

import { STATUS_META, STAGE_META, TYPE_META, CATEGORY_COLOR } from '@/lib/domain';
import { useT } from '@/lib/i18n/I18nProvider';

export function StatusBadge({ status }) {
  const t = useT();
  const m = STATUS_META[status] || {};
  return <span className="chip" style={{ background: m.bg, color: m.color }}>{t(`status.${status}`)}</span>;
}

export function TypeBadge({ type }) {
  const t = useT();
  const m = TYPE_META[type] || {};
  return <span className="chip" style={{ background: m.soft, color: m.color }}>{t(`type.${type}`)}</span>;
}

export function StageBadge({ stage }) {
  const t = useT();
  const m = STAGE_META[stage] || {};
  return <span className="chip" style={{ background: m.bg, color: m.color }}>{t(`stage.${stage}`)}</span>;
}

export function CategoryBadge({ category }) {
  const t = useT();
  const c = CATEGORY_COLOR[category] || { bg: 'var(--bg-2)', fg: 'var(--ink-soft)' };
  return <span className="chip" style={{ background: c.bg, color: c.fg }}>{t(`cat.${category}`)}</span>;
}

export function Dot({ color }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />;
}
