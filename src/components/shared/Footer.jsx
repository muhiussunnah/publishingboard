'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const cols = [
  { title: 'Workspace', links: [['Board', '/board'], ['Events', '/famevent'], ['Stats', '/stats'], ['To Do', '/todo']] },
  { title: 'Team', links: [['Files', '/files'], ['VideoStats', '/videostats'], ['Vault', '/credentials'], ['AI Writer', '/tools/mini-writer']] },
];

export default function Footer() {
  return (
    <footer className="border-t mt-8" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,.5)' }}>
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="font-display text-[18px] grad-text tracking-tight2">famies</span>
            </Link>
            <p className="text-[13px] mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
              The internal CRM for the Famies team — publishing, events, video, tasks and stats in one place.
            </p>
          </div>
          <div className="flex gap-12">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="text-[12px] font-semibold mb-3" style={{ color: 'var(--ink)' }}>{c.title}</h4>
                <ul className="space-y-2">
                  {c.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="text-[13px] transition-colors hover:text-[var(--pink-600)]" style={{ color: 'var(--muted)' }}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-5 border-t flex items-center justify-between text-[12px]" style={{ borderColor: 'var(--line)', color: 'var(--faint)' }}>
          <span>© {new Date().getFullYear()} Famies · Internal use only</span>
          <span className="mono">Next.js + Supabase</span>
        </div>
      </div>
    </footer>
  );
}
