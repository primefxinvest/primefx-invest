'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ErrorState } from '@/components/shared/data-state'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    console.error('[dashboard-error]', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <ErrorState
        title={t('genericError')}
        description={t('loadErrorDescription')}
        onRetry={reset}
      />
    </div>
  )
}
