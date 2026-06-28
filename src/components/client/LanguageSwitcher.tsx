'use client';

import { locales } from '@/lib/i18n';
import { useI18n } from './I18nProvider';

export function LanguageSwitcher() {
  const { locale, setLocale, dictionary } = useI18n();

  return (
    <div className="brand-switch flex items-center gap-2">
      <span className="sr-only">{dictionary.language.label}</span>
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={`relative px-1 py-2 transition duration-500 ${
            locale === item
              ? 'text-[var(--text-primary)] after:absolute after:inset-x-1 after:bottom-1 after:h-px after:bg-[var(--text-primary)]'
              : 'hover:text-[var(--text-primary)]'
          }`}
        >
          {dictionary.language[item]}
        </button>
      ))}
    </div>
  );
}
