'use client';

import { Plus, CalendarRange, Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Logo from '@/components/ui/Logo';

export default function Header({ backend, onNew, onDistribute }) {
  const { t, lang, toggleLang } = useI18n();
  const live = backend === 'supabase';

  return (
    <header className="sticky top-16 z-30 glass">
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-7">
        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={42} className="shrink-0" />
            <div className="min-w-0 leading-none">
              <div className="flex items-center gap-2">
                <span className="font-display text-[19px] tracking-tight2" style={{ color: 'var(--ink)' }}>{t('app.name')}</span>
                <span className="chip" style={{ background: 'var(--grad-soft)', color: 'var(--pink-600)' }}>{t('app.board')}</span>
              </div>
              <p className="text-[12px] mt-1.5 truncate hidden md:block" style={{ color: 'var(--muted)' }}>{t('app.tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] font-medium pr-1" style={{ color: 'var(--muted)' }}>
              <span className="dot" style={{ background: live ? 'var(--green)' : 'var(--faint)', boxShadow: live ? '0 0 0 3px var(--greenbg)' : 'none' }} />
              {live ? t('misc.supabaseMode') : t('misc.demoMode')}
            </span>

            <button onClick={toggleLang} className="btn btn-outline !px-3" aria-label={t('lang.label')} title={t('lang.switch')}>
              <Languages size={15} />
              <span className="mono text-[12px] font-semibold">{lang === 'sv' ? 'EN' : 'SV'}</span>
            </button>

            <button onClick={onDistribute} className="btn btn-outline hidden sm:inline-flex" title={t('action.distribute')}>
              <CalendarRange size={15} /> <span className="hidden xl:inline">{t('action.distribute')}</span>
            </button>

            <button onClick={onNew} className="btn btn-primary">
              <Plus size={16} /> <span className="hidden sm:inline">{t('action.new')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
