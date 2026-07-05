'use client'

import { CheckCircle2, Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const TIP_KEYS = ['tipsAutoConfirm', 'tipsLargeDeposits', 'tipsBlockchain', 'tipsSupport'] as const

export function DepositTipsPanel() {
  const t = useTranslations('wallet.deposit')

  return (
    <div className={cn(dashboardCardClass, 'shadow-md')}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lightbulb className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-sm font-semibold text-foreground sm:text-base">{t('tipsTitle')}</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {TIP_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
