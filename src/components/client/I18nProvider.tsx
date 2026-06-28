'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, Dictionary, getDictionary, isLocale, Locale } from '@/lib/i18n';

interface I18nContextValue {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem('locale');
    const browser = window.navigator.language?.slice(0, 2);
    const nextLocale = isLocale(stored) ? stored : isLocale(browser) ? browser : defaultLocale;
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem('locale', locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      dictionary: getDictionary(locale),
      setLocale: setLocaleState,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}
