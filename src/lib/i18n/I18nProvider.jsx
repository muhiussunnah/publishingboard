'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { messages, DEFAULT_LANG, LANGS, translate } from './messages';

const I18nContext = createContext({ lang: DEFAULT_LANG, t: (k) => k, setLang: () => {} });

export function I18nProvider({ initialLang = DEFAULT_LANG, children }) {
  const [lang, setLangState] = useState(LANGS.includes(initialLang) ? initialLang : DEFAULT_LANG);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    const l = LANGS.includes(next) ? next : DEFAULT_LANG;
    setLangState(l);
    try {
      document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
      localStorage.setItem('lang', l);
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'sv' ? 'en' : 'sv');
  }, [lang, setLang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  return (
    <I18nContext.Provider value={{ lang, t, setLang, toggleLang, dict: messages[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}
