'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/invest', label: 'Invest' },
  { href: '/about', label: 'About Us' },
  { href: '/academy', label: 'Academy' },
  { href: '/market-insights', label: 'Market Insights' },
  { href: '/community', label: 'Community' },
  { href: '/support', label: 'Support' },
]

function NavActions({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const { loading, isAuthenticated, dashboardHref, loginHref, loginLabel, signupHref, signupLabel } =
    useAuthEntry()

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
        Dashboard
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
        {loginLabel}
      </Link>
      <Link
        href={signupHref}
        onClick={onNavigate}
        className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-700"
      >
        {signupLabel}
      </Link>
    </div>
  )
}

export default function LandingNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo href="/" size={36} className="shrink-0" />

          <div className="hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  isActive(link.href) ? 'text-[#0052ff]' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <NavActions className="hidden sm:flex" />
            <button
              type="button"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 xl:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-gray-100 py-4 xl:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive(link.href)
                      ? 'bg-blue-50 text-[#0052ff]'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <NavActions className="mt-2 w-full flex-col sm:hidden" onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
