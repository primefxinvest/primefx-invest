'use client'

import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { PLATFORM_FEE_RATES, WITHDRAWAL_NOTICE_DAYS } from '@/lib/fees/constants'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const MAX_WITHDRAWAL_PER_TX = 10_000

type WithdrawLimitsCardProps = {
  dailyUsed?: number
  dailyMax?: number
  monthlyUsed?: number
  monthlyMax?: number
  verified?: boolean
  className?: string
}

export function WithdrawLimitsCard({
  dailyUsed = 1250,
  dailyMax = 25000,
  monthlyUsed = 4250,
  monthlyMax = 100000,
  verified = true,
  className,
}: WithdrawLimitsCardProps) {
  const t = useTranslations('wallet.withdraw')
  const tSide = useTranslations('wallet.sidePanels')

  const dailyPct = Math.min(100, Math.round((dailyUsed / dailyMax) * 100))
  const monthlyPct = Math.min(100, Math.round((monthlyUsed / monthlyMax) * 100))
  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal
  const feePercent = (PLATFORM_FEE_RATES.withdrawal * 100).toFixed(0)

  const rules = [
    { label: t('limitsMin'), value: `$${minWithdrawal.toFixed(2)}` },
    { label: t('limitsMax'), value: `$${MAX_WITHDRAWAL_PER_TX.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { label: t('limitsFee'), value: `${feePercent}%` },
    { label: t('limitsProcessing'), value: t('processingTimeRange') },
    { label: t('limitsNotice'), value: `${WITHDRAWAL_NOTICE_DAYS} ${t('days')}` },
  ]

  return (
    <div className={cn(dashboardCardClass, className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className={dashboardSectionTitleClass}>{tSide('limits')}</h3>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {tSide('verifiedAccount')}
          </span>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{tSide('dailyLimit')}</span>
            <span className="font-medium tabular-nums">
              ${dailyUsed.toLocaleString()} / ${dailyMax.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#0052ff] transition-all"
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{tSide('monthlyLimit')}</span>
            <span className="font-medium tabular-nums">
              ${monthlyUsed.toLocaleString()} / ${monthlyMax.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#0052ff] transition-all"
              style={{ width: `${monthlyPct}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{rule.label}</span>
            <span className="font-semibold tabular-nums text-foreground">{rule.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
