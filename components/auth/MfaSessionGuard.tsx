'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'

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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0052ff]" />
      </div>
    )
  }

  return <>{children}</>
}
