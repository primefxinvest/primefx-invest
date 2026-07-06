'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Headphones, LayoutDashboard, MessageSquare, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin/support', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/support/tickets', label: 'Tickets', icon: Ticket, exact: false },
  { href: '/admin/support/messages', label: 'Live Messages', icon: MessageSquare, exact: false },
] as const

export function AdminSupportNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <div className="mr-2 flex items-center gap-2 pr-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Headphones className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-bold text-foreground">Support Center</span>
      </div>
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
