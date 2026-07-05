import type { AppLocale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { LOCALE_STORAGE_KEY } from '@/lib/i18n/locale-config'

export function isValidLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && routing.locales.includes(value as AppLocale))
}

export function getStoredLocale(): AppLocale | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isValidLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function setStoredLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
