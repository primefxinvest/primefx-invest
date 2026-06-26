'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'

function getAuthToggle(pathname: string) {
  if (pathname === '/login') {
    return { href: '/signup', label: 'Create account' }
  }
  if (pathname === '/signup') {
    return { href: '/login', label: 'Sign in' }
  }
  if (pathname === MFA_VERIFY_ROUTE) {
    return { href: '/login', label: 'Back to login' }
  }
  return null
}

export function AuthLayoutNav() {
  const pathname = usePathname()
  const authToggle = getAuthToggle(pathname)

  return (
    <header className="absolute inset-x-0 top-0 z-10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          <span>Back to Home</span>
        </Link>

        {authToggle ? (
          <Link
            href={authToggle.href}
            className="rounded-lg px-2 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:underline sm:px-3"
          >
            {authToggle.label}
          </Link>
        ) : null}
      </div>
    </header>
  )
}
