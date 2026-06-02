'use client';

import { Plus, CalendarRange, Languages, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Logo from '@/components/ui/Logo';

export default function Header({ backend, onNew, onDistribute }) {
  const { t, lang, toggleLang } = useI18n();
  const live = backend === 'supabase';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'rgba(250,248,245,.82)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={42} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-[20px] leading-none" style={{ color: 'var(--ink)' }}>{t('app.name')}</span>
                <span className="chip" style={{ background: 'var(--c-pink-soft)', color: 'var(--c-pink-deep)' }}>{t('app.board')}</span>
              </div>
              <p className="text-[12px] mt-1 truncate hidden sm:block" style={{ color: 'var(--ink-muted)' }}>{t('app.tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="chip hidden md:inline-flex"
              title={live ? 'Supabase' : 'Local JSON store'}
              style={{ background: live ? 'var(--c-green-soft)' : 'var(--bg-2)', color: live ? 'var(--c-green)' : 'var(--ink-muted)' }}
            >
              <Sparkles size={12} /> {live ? t('misc.supabaseMode') : t('misc.demoMode')}
            </span>

            <button onClick={toggleLang} className="btn btn-outline" aria-label={t('lang.label')}>
              <Languages size={15} />
              <span className="mono text-[12px]">{lang === 'sv' ? 'EN' : 'SV'}</span>
            </button>

            <button onClick={onDistribute} className="btn btn-outline hidden sm:inline-flex">
              <CalendarRange size={15} /> <span className="hidden lg:inline">{t('action.distribute')}</span>
            </button>

            <button onClick={onNew} className="btn btn-pink">
              <Plus size={16} /> <span className="hidden sm:inline">{t('action.new')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
