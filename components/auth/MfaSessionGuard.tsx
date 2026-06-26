'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
import { AppSessionSkeleton } from '@/components/shared/skeletons'

const MFA_CHECK_TIMEOUT_MS = 10_000

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export default function MfaSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    async function checkMfa() {
      try {
        const mfa = await withTimeout(
          needsMfaChallenge(),
          MFA_CHECK_TIMEOUT_MS,
          { required: false }
        )
        if (!active) return

        if (mfa.required) {
          const params = new URLSearchParams({ redirect: pathname })
          router.replace(`${MFA_VERIFY_ROUTE}?${params.toString()}`)
          return
        }

        setReady(true)
      } catch {
        if (active) setReady(true)
      }
    }

    setReady(false)
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
