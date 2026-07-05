'use client'

import { CheckCircle2, Link2, Lock, ScanLine, Shield, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const TRUST_ITEMS = [
  { key: 'trustAddressVerification', icon: CheckCircle2 },
  { key: 'trustSecureTransfer', icon: Link2 },
  { key: 'trustEncrypted', icon: Lock },
  { key: 'trustAntiFraud', icon: Shield },
  { key: 'trustConfirmation', icon: ScanLine },
] as const

export function WithdrawTrustPanel({ className }: { className?: string }) {
  const t = useTranslations('wallet.withdraw')

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TRUST_ITEMS.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-3 py-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-xs font-semibold leading-tight text-foreground">{t(key)}</span>
          </div>
        ))}
      </div>

      <div className={cn(dashboardCardClass, 'border-primary/20 bg-primary/5 py-4')}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0052ff]" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground">{t('irreversibleNotice')}</p>
        </div>
      </div>
    </div>
  )
}
