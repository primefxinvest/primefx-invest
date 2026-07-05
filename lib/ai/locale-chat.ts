import type { AppLocale } from '@/i18n/routing'
import { getLanguageNameForAi } from '@/lib/i18n/locale-config'

export function resolveChatLocale(value: unknown): AppLocale | 'en' {
  if (typeof value !== 'string') return 'en'
  const normalized = value.trim().toLowerCase()
  const supported: AppLocale[] = ['en', 'fr', 'es', 'de', 'ar', 'pt', 'sw', 'rw']
  return supported.includes(normalized as AppLocale) ? (normalized as AppLocale) : 'en'
}

export function buildLocaleSystemInstruction(locale: string): string {
  const language = getLanguageNameForAi(locale)
  return `IMPORTANT: Always respond in ${language}. Match the user's language when they write in another language, but default to ${language} for this session.`
}
