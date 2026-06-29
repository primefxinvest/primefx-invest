'use client'

import { useEffect } from 'react'

/** Keeps document lang in sync for localized routes (root layout uses lang="en" default). */
export function LocaleHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
