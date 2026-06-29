'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MFA_VERIFY_ROUTE } from '@/lib/auth/routes'

function getAuthToggle(pathname: string, t: ReturnType<typeof useTranslations>) {
  if (pathname === '/login') {
    return { href: '/signup', label: t('createAccount') }
  }
  if (pathname === '/signup') {
    return { href: '/login', label: t('signIn') }
  }
  if (pathname === MFA_VERIFY_ROUTE) {
    return { href: '/login', label: t('backToLogin') }
  }
  return null
}

export function AuthLayoutNav() {
  const t = useTranslations('auth')
  const pathname = usePathname()
  const authToggle = getAuthToggle(pathname, t)

  return (
    <header className="absolute inset-x-0 top-0 z-10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          <span>{t('backToHome')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          {authToggle ? (
            <Link
              href={authToggle.href}
              className="rounded-lg px-2 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:underline sm:px-3"
            >
              {authToggle.label}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
