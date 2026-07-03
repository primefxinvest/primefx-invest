'use client'

import { useEffect, useState, useTransition } from 'react'
import { Link } from '@/i18n/navigation'
import { acknowledgeTermsAction, checkTermsAcknowledgementAction } from '@/lib/terms/actions'

export function TermsAcknowledgementBanner() {
  const [required, setRequired] = useState(false)
  const [version, setVersion] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    checkTermsAcknowledgementAction().then((result) => {
      setRequired(result.required)
      setVersion(result.version)
    })
  }, [])

  if (!required) return null

  const handleAck = () => {
    startTransition(async () => {
      await acknowledgeTermsAction(version)
      setRequired(false)
    })
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Updated investment terms</p>
      <p className="mt-1">
        Our referral program and investment terms have been updated. Please review the{' '}
        <Link href="/legal" className="font-semibold underline">
          Legal Center
        </Link>{' '}
        and acknowledge to continue.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={handleAck}
        className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        I acknowledge the updated terms
      </button>
    </div>
  )
}
