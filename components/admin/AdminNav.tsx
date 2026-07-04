import Link from 'next/link'
import {
  Award,
  BarChart3,
  FileText,
  Lock,
  MessageCircle,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { ADMIN_NAV_ITEMS } from '@/lib/admin/permissions'
import { canAccessModule } from '@/lib/admin/permissions'
import type { AdminTier } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

const ICONS = {
  BarChart3,
  Users,
  FileText,
  Zap,
  Wallet,
  TrendingUp,
  Award,
  Lock,
  Settings,
  ShieldCheck,
  MessageCircle,
} as const

interface AdminNavProps {
  tier: AdminTier
  pathname: string
  onNavigate?: () => void
}

export function AdminNav({ tier, pathname, onNavigate }: AdminNavProps) {
  const items = ADMIN_NAV_ITEMS.filter((item) => canAccessModule(tier, item.module))

  return (
    <nav className="primefx-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
      {items.map(({ href, label, icon }) => {
        const Icon = ICONS[icon as keyof typeof ICONS]
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors',
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
