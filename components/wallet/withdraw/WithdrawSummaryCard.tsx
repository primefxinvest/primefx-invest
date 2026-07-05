'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type WithdrawSummaryCardProps = {
  withdrawalAmount: string
  networkFee: string
  platformFee: string
  youWillReceive: string
  processingTime: string
  className?: string
}

export function WithdrawSummaryCard({
  withdrawalAmount,
  networkFee,
  platformFee,
  youWillReceive,
  processingTime,
  className,
}: WithdrawSummaryCardProps) {
  const t = useTranslations('wallet.withdraw')

  const rows = [
    { label: t('summaryWithdrawalAmount'), value: withdrawalAmount },
    { label: t('summaryNetworkFee'), value: networkFee },
    { label: t('summaryPlatformFee'), value: platformFee },
  ]

  return (
    <div className={cn(dashboardCardClass, 'border-border/80', className)}>
      <h2 className={dashboardSectionTitleClass}>{t('summaryTitle')}</h2>

      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-semibold tabular-nums text-foreground">{row.value}</dd>
          </div>
        ))}

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm font-semibold text-foreground">{t('youWillReceive')}</dt>
            <dd className="text-xl font-bold tabular-nums text-[#0052ff]">{youWillReceive}</dd>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-[#0052ff]" aria-hidden />
            {t('summaryProcessingTime')}
          </dt>
          <dd className="text-sm font-semibold text-[#0052ff]">{processingTime}</dd>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">{t('summaryBlockchainNote')}</p>
      </dl>
    </div>
  )
}
