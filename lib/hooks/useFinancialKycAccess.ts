'use client'

import { useEffect, useState } from 'react'
import {
  getFinancialKycAccess,
  type FinancialKycAccess,
} from '@/lib/investor/kyc-actions'

const defaultAccess: FinancialKycAccess = {
  verified: false,
  status: 'pending',
  summary: null,
}

export function useFinancialKycAccess() {
  const [access, setAccess] = useState<FinancialKycAccess & { loading: boolean }>({
    ...defaultAccess,
    loading: true,
  })

  useEffect(() => {
    let active = true

    getFinancialKycAccess()
      .then((result) => {
        if (active) {
          setAccess({ ...result, loading: false })
        }
      })
      .catch(() => {
        if (active) {
          setAccess({ ...defaultAccess, loading: false })
        }
      })

    const refresh = () => {
      getFinancialKycAccess()
        .then((result) => {
          if (active) {
            setAccess({ ...result, loading: false })
          }
        })
        .catch(() => {
          if (active) {
            setAccess({ ...defaultAccess, loading: false })
          }
        })
    }

    window.addEventListener('primefx:profile-updated', refresh)

    const timeoutId = window.setTimeout(() => {
      if (active) {
        setAccess((current) => (current.loading ? { ...current, loading: false } : current))
      }
    }, 10_000)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      window.removeEventListener('primefx:profile-updated', refresh)
    }
  }, [])

  return access
}
