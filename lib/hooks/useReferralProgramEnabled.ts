'use client'

import { useEffect, useState } from 'react'
import { fetchReferralProgramEnabledAction } from '@/lib/referral/settings-actions'

export function useReferralProgramEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchReferralProgramEnabledAction()
      .then((value) => {
        if (active) setEnabled(value)
      })
      .catch(() => {
        if (active) setEnabled(false)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { enabled: enabled ?? false, loading }
}
