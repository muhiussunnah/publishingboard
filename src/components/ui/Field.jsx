'use client';

export function FormRow({ children, cols = 2 }) {
  return <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>{children}</div>;
}

export function Field({ label, children, hint, full }) {
  return (
    <div className={full ? 'mb-4' : ''}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {hint && <p className="text-[11.5px] mt-1.5" style={{ color: 'var(--ink-muted)' }}>{hint}</p>}
    </div>
  );
}

export function Input({ value, onChange, type = 'text', ...rest }) {
  return <input className="field-input" type={type} value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} {...rest} />;
}

export function Textarea({ value, onChange, ...rest }) {
  return <textarea className="field-textarea" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} {...rest} />;
}

export function Select({ value, onChange, options, placeholder, ...rest }) {
  return (
    <select className="field-select" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={() => onChange?.(!checked)}
        className="relative w-[42px] h-[24px] rounded-full transition"
        style={{ background: checked ? 'var(--c-green)' : 'var(--line-strong)' }}
      >
        <span className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(18px)' : 'none', boxShadow: 'var(--shadow-sm)' }} />
      </span>
      {label && <span className="text-[13.5px]" style={{ color: 'var(--ink-soft)' }}>{label}</span>}
    </label>
  );
}
