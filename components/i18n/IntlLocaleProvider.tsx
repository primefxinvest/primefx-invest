'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useEffect } from 'react'
import type { AppLocale } from '@/i18n/routing'
import { LOCALE_CHANGED_EVENT, isRtlLocale } from '@/lib/i18n/locale-config'
import { setStoredLocale } from '@/lib/i18n/locale-storage'

type IntlLocaleProviderProps = {
  children: React.ReactNode
  locale: AppLocale
  messages: Record<string, unknown>
}

export function IntlLocaleProvider({ children, locale, messages }: IntlLocaleProviderProps) {
  useEffect(() => {
    setStoredLocale(locale)
    document.documentElement.lang = locale
    document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: { locale } }))
  }, [locale])

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  )
}
