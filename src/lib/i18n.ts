import { en } from '@/locales/en';
import { vi } from '@/locales/vi';

export const dictionaries = { en, vi };
export const locales = ['vi', 'en'] as const;

export type Locale = (typeof locales)[number];
export type Dictionary = (typeof dictionaries)[Locale];

export const defaultLocale: Locale = 'vi';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'vi' || value === 'en';
}

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] || dictionaries[defaultLocale];
}
