'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
import { AppSessionSkeleton } from '@/components/shared/skeletons'

export default function MfaSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    async function checkMfa() {
      const mfa = await needsMfaChallenge()
      if (!active) return

      if (mfa.required) {
        const params = new URLSearchParams({ redirect: pathname })
        router.replace(`${MFA_VERIFY_ROUTE}?${params.toString()}`)
        return
      }

      setReady(true)
    }

    checkMfa()

    return () => {
      active = false
    }
  }, [pathname, router])

  if (!ready) {
    return <AppSessionSkeleton pathname={pathname} />
  }

  return <>{children}</>
}
