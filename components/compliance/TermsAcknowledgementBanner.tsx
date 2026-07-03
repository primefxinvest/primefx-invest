'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { acknowledgeTermsAction } from '@/lib/terms/actions'

type TermsAcknowledgementBannerProps = {
  required: boolean
  version: string
}

export function TermsAcknowledgementBanner({
  required: initialRequired,
  version,
}: TermsAcknowledgementBannerProps) {
  const t = useTranslations('compliance')
  const [visible, setVisible] = useState(initialRequired)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setVisible(initialRequired)
  }, [initialRequired])

  if (!visible || !version) return null

  const handleAck = () => {
    startTransition(async () => {
      const result = await acknowledgeTermsAction(version)
      if (!result.success) {
        toast.error(result.error ?? t('termsAcknowledgeError'))
        return
      }
      toast.success(t('termsAcknowledgeSuccess'))
      setVisible(false)
    })
  }

  return (
    <div
      role="region"
      aria-live="polite"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-semibold">{t('termsUpdatedTitle')}</p>
      <p className="mt-1">
        {t('termsUpdatedDescriptionBefore')}{' '}
        <Link href="/legal" className="font-semibold underline hover:text-amber-900">
          {t('termsLegalCenter')}
        </Link>{' '}
        {t('termsUpdatedDescriptionAfter')}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={handleAck}
        className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t('termsAcknowledge')}
      </button>
    </div>
  )
}
