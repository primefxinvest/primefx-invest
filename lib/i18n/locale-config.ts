import type { AppLocale } from '@/i18n/routing'

export const LOCALE_STORAGE_KEY = 'primefx-locale'
export const LOCALE_CHANGED_EVENT = 'primefx:locale-changed'

export type LocaleMeta = {
  label: string
  nativeName: string
  short: string
  flag: string
  languageName: string
}

export const localeMeta: Record<AppLocale, LocaleMeta> = {
  en: {
    label: 'English',
    nativeName: 'English',
    short: 'EN',
    flag: '🇬🇧',
    languageName: 'English',
  },
  fr: {
    label: 'French',
    nativeName: 'Français',
    short: 'FR',
    flag: '🇫🇷',
    languageName: 'French',
  },
  es: {
    label: 'Spanish',
    nativeName: 'Español',
    short: 'ES',
    flag: '🇪🇸',
    languageName: 'Spanish',
  },
  de: {
    label: 'German',
    nativeName: 'Deutsch',
    short: 'DE',
    flag: '🇩🇪',
    languageName: 'German',
  },
  ar: {
    label: 'Arabic',
    nativeName: 'العربية',
    short: 'AR',
    flag: '🇸🇦',
    languageName: 'Arabic',
  },
  pt: {
    label: 'Portuguese',
    nativeName: 'Português',
    short: 'PT',
    flag: '🇵🇹',
    languageName: 'Portuguese',
  },
  sw: {
    label: 'Swahili',
    nativeName: 'Kiswahili',
    short: 'SW',
    flag: '🇰🇪',
    languageName: 'Swahili',
  },
  rw: {
    label: 'Kinyarwanda',
    nativeName: 'Ikinyarwanda',
    short: 'RW',
    flag: '🇷🇼',
    languageName: 'Kinyarwanda',
  },
}

export const rtlLocales: AppLocale[] = ['ar']

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale as AppLocale)
}

export function getLocaleMeta(locale: string): LocaleMeta {
  return localeMeta[locale as AppLocale] ?? localeMeta.en
}

export function getLanguageNameForAi(locale: string): string {
  return getLocaleMeta(locale).languageName
}

export const languageOptions = (Object.keys(localeMeta) as AppLocale[]).map((value) => ({
  value,
  ...localeMeta[value],
}))
