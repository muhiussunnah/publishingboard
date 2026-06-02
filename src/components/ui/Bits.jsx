'use client';

export function SectionTitle({ children, count, accent }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5 mt-1">
      <span className="w-1.5 h-5 rounded-full" style={{ background: accent || 'var(--c-pink)' }} />
      <h2 className="font-display text-[20px]" style={{ color: 'var(--ink)' }}>{children}</h2>
      {count != null && <span className="chip" style={{ background: 'var(--bg-2)', color: 'var(--ink-muted)' }}>{count}</span>}
    </div>
  );
}

export function CardGrid({ children }) {
  return <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16 px-6 fade-in">
      {Icon && <span className="grid place-items-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--c-green-soft)', color: 'var(--c-green)' }}><Icon size={26} /></span>}
      <p className="font-display text-[19px]" style={{ color: 'var(--ink)' }}>{title}</p>
      {hint && <p className="text-[13px] mt-1.5 max-w-sm" style={{ color: 'var(--ink-muted)' }}>{hint}</p>}
    </div>
  );
}
