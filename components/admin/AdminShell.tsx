'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminTierBadge } from '@/components/admin/AdminTierBadge'
import type { AdminContext } from '@/lib/admin/types'
import { usePathname } from 'next/navigation'

interface AdminShellProps {
  context: AdminContext
  children: React.ReactNode
}

export function AdminShell({ context, children }: AdminShellProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-6">
          <Logo href="/admin" tagline="ADMIN" size={40} />
        </div>

        <AdminNav tier={context.tier} pathname={pathname} />

        <div className="border-t border-border p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">Back to App</span>
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="min-w-0 shrink">
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">Admin Portal</h1>
            {context.isBootstrap ? (
              <p className="mt-0.5 text-xs text-amber-600">
                Bootstrap Super Admin (set ADMIN_SUPER_EMAILS or admin_profiles)
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AdminTierBadge tier={context.tier} />
            <div className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:block md:max-w-[14rem]">
              {context.email}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {context.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="primefx-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
