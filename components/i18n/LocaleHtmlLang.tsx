'use client'

import { useEffect } from 'react'
import { isRtlLocale } from '@/lib/i18n/locale-config'

/** Keeps document lang/dir in sync for localized routes. */
export function LocaleHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
  }, [locale])

  return null
}
