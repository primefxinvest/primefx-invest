'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminTierBadge } from '@/components/admin/AdminTierBadge'
import type { AdminContext } from '@/lib/admin/types'
import { usePathname } from 'next/navigation'
import {
  ADMIN_SIDEBAR_WIDTH_DESKTOP_CLASS,
  ADMIN_SIDEBAR_WIDTH_MOBILE_CLASS,
} from '@/lib/layout/admin-sidebar'
import { cn } from '@/lib/utils'

interface AdminShellProps {
  context: AdminContext
  children: React.ReactNode
}

export function AdminShell({ context, children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close admin menu"
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card pt-[env(safe-area-inset-top,0px)] shadow-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:shrink-0 lg:shadow-none',
          ADMIN_SIDEBAR_WIDTH_MOBILE_CLASS,
          ADMIN_SIDEBAR_WIDTH_DESKTOP_CLASS,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6 lg:py-6">
          <Logo href="/admin" tagline="ADMIN" sizeKey="sidebarFull" />
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AdminNav tier={context.tier} pathname={pathname} onNavigate={closeMobile} />

        <div className="border-t border-border p-4">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Back to App</span>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-2xl">Admin Portal</h1>
              {context.isBootstrap ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-amber-600 sm:line-clamp-1">
                  Bootstrap Super Admin (admin_profiles row pending — only fxinvestprime@gmail.com)
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AdminTierBadge tier={context.tier} />
            <div className="hidden max-w-[10rem] truncate text-sm text-muted-foreground md:block lg:max-w-[14rem]">
              {context.email}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary sm:h-10 sm:w-10">
              {context.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="primefx-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
