'use client'

import { useTranslations } from 'next-intl'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type DepositSummaryCardProps = {
  depositAmount: string
  networkFeeEstimate: string
  expectedCredit: string
  processingTime: string
  methodLabel: string
  currencyLabel: string
}

export function DepositSummaryCard({
  depositAmount,
  networkFeeEstimate,
  expectedCredit,
  processingTime,
  methodLabel,
  currencyLabel,
}: DepositSummaryCardProps) {
  const t = useTranslations('wallet.deposit')

  const rows = [
    { label: t('summaryDepositAmount'), value: depositAmount },
    { label: t('summaryMethod'), value: methodLabel },
    { label: t('summaryCurrency'), value: currencyLabel },
    { label: t('summaryNetworkFee'), value: networkFeeEstimate },
    { label: t('summaryExpectedCredit'), value: expectedCredit, highlight: true },
    { label: t('summaryProcessingTime'), value: processingTime },
  ]

  return (
    <div className={cn(dashboardCardClass, 'border-border/80 bg-muted/20')}>
      <h2 className={dashboardSectionTitleClass}>{t('summaryTitle')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('summarySubtitle')}</p>

      <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-card">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd
              className={cn(
                'text-right text-sm font-semibold tabular-nums text-foreground',
                row.highlight && 'text-base font-bold text-primary'
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
