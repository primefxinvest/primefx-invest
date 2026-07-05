import { defineRouting } from 'next-intl/routing'

export const locales = ['en', 'fr', 'es', 'de', 'ar'] as const
export type AppLocale = (typeof locales)[number]

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})
