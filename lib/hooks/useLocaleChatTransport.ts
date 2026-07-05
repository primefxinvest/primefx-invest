'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { DefaultChatTransport } from 'ai'
import type { AppLocale } from '@/i18n/routing'

export function useLocaleChatTransport() {
  const locale = useLocale() as AppLocale

  return useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: { locale },
      }),
    [locale]
  )
}
