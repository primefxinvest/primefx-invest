import { ADMIN_TIER_LABELS } from '@/lib/admin/permissions'
import type { AdminTier } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

const TIER_STYLES: Record<AdminTier, string> = {
  1: 'bg-amber-100 text-amber-800 ring-amber-200',
  2: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  3: 'bg-blue-100 text-blue-800 ring-blue-200',
  4: 'bg-purple-100 text-purple-800 ring-purple-200',
  5: 'bg-slate-100 text-slate-800 ring-slate-200',
}

export function AdminTierBadge({ tier, roleLabel }: { tier: AdminTier; roleLabel?: string }) {
  const label = roleLabel ?? ADMIN_TIER_LABELS[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TIER_STYLES[tier]
      )}
    >
      L{tier} · {label}
    </span>
  )
}
