'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { DefaultChatTransport } from 'ai'
import type { AppLocale } from '@/i18n/routing'

export function useAssistanceChatTransport(sessionId: string | null) {
  const locale = useLocale() as AppLocale

  return useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/assistance',
        body: { locale, sessionId },
      }),
    [locale, sessionId]
  )
}
