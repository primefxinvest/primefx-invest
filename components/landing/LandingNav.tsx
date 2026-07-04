'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'
import { cn } from '@/lib/utils'

const GUEST_PROTECTED_NAV_ROUTES = [
  '/invest',
  '/academy',
  '/market-insights',
  '/community',
  '/support',
] as const

function resolveNavHref(href: string, isAuthenticated: boolean, signupHref: string) {
  if (isAuthenticated || href === '/') return href
  if ((GUEST_PROTECTED_NAV_ROUTES as readonly string[]).includes(href)) {
    return `${signupHref}?redirect=${encodeURIComponent(href)}`
  }
  return href
}

function NavActions({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const t = useTranslations('nav')
  const { loading, isAuthenticated, dashboardHref, loginHref, signupHref } = useAuthEntry()

  if (loading) {
    return <div className={cn('h-10 w-28 animate-pulse rounded-lg bg-gray-100', className)} />
  }

  if (isAuthenticated) {
    return (
      <Link
        href={dashboardHref}
        onClick={onNavigate}
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-700',
          className
        )}
      >
        {t('dashboard')}
      </Link>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Link
        href={loginHref}
        onClick={onNavigate}
        className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:inline-flex"
      >
        {t('signin')}
      </Link>
      <Link
        href={signupHref}
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-700"
      >
        {t('signup')}
      </Link>
    </div>
  )
}

export default function LandingNav() {
  const t = useTranslations('landing')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { isAuthenticated, signupHref } = useAuthEntry()

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/invest', label: t('invest') },
    { href: '/about', label: t('aboutUs') },
    { href: '/academy', label: t('academy') },
    { href: '/market-insights', label: t('marketInsights') },
    { href: '/community', label: t('community') },
    { href: '/support', label: t('support') },
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-50 overflow-x-hidden border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 min-w-0 max-w-8xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo href="/" sizeKey="marketing" priority />

        <nav className="hidden min-w-0 items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={resolveNavHref(link.href, isAuthenticated, signupHref)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                  ? 'bg-blue-50 text-[#0052ff]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <NavActions />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? t('closeMenu') : t('openMenu')}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-gray-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={resolveNavHref(link.href, isAuthenticated, signupHref)}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
            <LanguageSwitcher variant="compact" />
            <NavActions onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  )
}
