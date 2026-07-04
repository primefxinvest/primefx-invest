'use client'

import { Link } from '@/i18n/navigation'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'

const GUEST_PROTECTED_ROUTES = ['/academy', '/community'] as const

function resolveFooterHref(href: string, isAuthenticated: boolean, signupHref: string) {
  if (isAuthenticated || !(GUEST_PROTECTED_ROUTES as readonly string[]).includes(href)) {
    return href
  }
  return `${signupHref}?redirect=${encodeURIComponent(href)}`
}

interface LandingFooterProtectedLinksProps {
  academyLabel: string
  communityLabel: string
  className?: string
}

export function LandingFooterProtectedLinks({
  academyLabel,
  communityLabel,
  className,
}: LandingFooterProtectedLinksProps) {
  const { isAuthenticated, signupHref } = useAuthEntry()

  return (
    <>
      <li>
        <Link
          href={resolveFooterHref('/academy', isAuthenticated, signupHref)}
          className={className}
        >
          {academyLabel}
        </Link>
      </li>
      <li>
        <Link
          href={resolveFooterHref('/community', isAuthenticated, signupHref)}
          className={className}
        >
          {communityLabel}
        </Link>
      </li>
    </>
  )
}
