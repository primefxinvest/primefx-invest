'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { needsMfaChallenge } from '@/lib/auth/mfa'
import { getAuthenticatedEntryPath } from '@/lib/auth/session'
import { isAuthRoute, isMfaVerifyRoute } from '@/lib/auth/routes'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { localizePath } from '@/lib/i18n/pathname'
import { type AppLocale } from '@/i18n/routing'

interface AuthRedirectGuardProps {
  children: ReactNode
}

export default function AuthRedirectGuard({ children }: AuthRedirectGuardProps) {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    async function verifySession() {
      try {
        const { data: user, error } = await getCurrentUser()

        if (!active) return

        if (error || !user) {
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
            redirectParam,
            mfa.required
          )
          const [path, query] = destination.split('?')
          const localizedPath = localizePath(path, locale)
          const target = query ? `${localizedPath}?${query}` : localizedPath

          // Hard redirect avoids spinner deadlock when using the browser back button.
          window.location.replace(target)
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
  }, [locale, pathname, redirectParam])

  if (!ready) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
