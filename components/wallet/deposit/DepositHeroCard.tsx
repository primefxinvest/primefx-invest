'use client'

import { Clock, Lock, ShieldCheck, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type DepositHeroCardProps = {
  supportedCryptoCount: number
}

const TRUST_ITEMS = [
  { icon: ShieldCheck, labelKey: 'heroSecure' as const },
  { icon: Zap, labelKey: 'heroInstant' as const },
  { icon: Clock, labelKey: 'hero247' as const },
  { icon: Lock, labelKey: 'heroBankGrade' as const },
]

export function DepositHeroCard({ supportedCryptoCount }: DepositHeroCardProps) {
  const t = useTranslations('wallet.deposit')

  return (
    <div
      className={cn(
        dashboardCardClass,
        'relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card'
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {t('heroEyebrow')}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t('heroTitle')}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t('heroSubtitle')}</p>

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, labelKey }) => (
            <li
              key={labelKey}
              className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/80 px-3 py-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold leading-tight text-foreground">
                {t(labelKey)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          {t('heroCryptoCount', { count: supportedCryptoCount })}
        </p>
      </div>
    </div>
  )
}
