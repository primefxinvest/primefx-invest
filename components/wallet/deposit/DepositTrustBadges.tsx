'use client'

import {
  BadgeCheck,
  Clock,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const TRUST_ITEMS = [
  { key: 'trustNowPayments', icon: BadgeCheck },
  { key: 'trustSecureCrypto', icon: Lock },
  { key: 'trustInstantInvoice', icon: Zap },
  { key: 'trustBankGrade', icon: ShieldCheck },
  { key: 'trustFraudProtection', icon: Shield },
  { key: 'trustAutoCredit', icon: Wallet },
  { key: 'trust247', icon: Clock },
  { key: 'trustVerifiedInfra', icon: Sparkles },
] as const

export function DepositTrustBadges({ className }: { className?: string }) {
  const t = useTranslations('wallet.deposit')

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {TRUST_ITEMS.map(({ key, icon: Icon }) => (
        <div
          key={key}
          className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-sm"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="text-[11px] font-semibold leading-tight text-foreground">{t(key)}</span>
        </div>
      ))}
    </div>
  )
}
