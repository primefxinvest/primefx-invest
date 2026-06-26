'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { getAuthenticatedEntryPath } from '@/lib/auth/session'
import { isAuthRoute, isMfaVerifyRoute } from '@/lib/auth/routes'
import { getCurrentUser, supabase } from '@/lib/supabase'

interface AuthRedirectGuardProps {
  children: ReactNode
}

function isTransientAuthError(error: unknown) {
  if (error instanceof TypeError) {
    return error.message === 'Failed to fetch'
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message)
    return message === 'Failed to fetch' || message.toLowerCase().includes('network')
  }

  return false
}

export default function AuthRedirectGuard({ children }: AuthRedirectGuardProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    async function verifySession() {
      try {
        const { data: user, error } = await getCurrentUser()

        if (!active) return

        if (error || !user) {
          if (error && !isTransientAuthError(error)) {
            try {
              await supabase.auth.signOut()
            } catch {
              // Ignore sign-out failures (e.g. offline).
            }
          }
          setReady(true)
          return
        }

        if (isMfaVerifyRoute(pathname)) {
          setReady(true)
          return
        }

        if (isAuthRoute(pathname)) {
          const mfa = await needsMfaChallenge()
          if (!active) return

          const destination = getAuthenticatedEntryPath(
            searchParams.get('redirect'),
            mfa.required
          )

          // Hard redirect avoids spinner deadlock when using the browser back button.
          window.location.replace(destination)
          return
        }

        setReady(true)
      } catch {
        if (active) setReady(true)
      }
    }

    setReady(false)
    verifySession()

    const safetyTimer = window.setTimeout(() => {
      if (active) setReady(true)
    }, 4000)

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      setReady(false)
      verifySession()
    }

    window.addEventListener('pageshow', onPageShow)

    return () => {
      active = false
      window.clearTimeout(safetyTimer)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [pathname, searchParams])

  if (!ready) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
