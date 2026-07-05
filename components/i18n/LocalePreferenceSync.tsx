'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'
import { getStoredLocale } from '@/lib/i18n/locale-storage'

/** Applies stored locale preference on first client mount without a full page reload. */
export function LocalePreferenceSync() {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const synced = useRef(false)

  useEffect(() => {
    if (synced.current) return
    synced.current = true

    const stored = getStoredLocale()
    if (stored && stored !== locale) {
      router.replace(pathname, { locale: stored })
    }
  }, [locale, pathname, router])

  return null
}
