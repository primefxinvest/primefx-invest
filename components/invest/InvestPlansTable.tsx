'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Star } from 'lucide-react'
import { ScrollTable } from '@/components/shared/ScrollTable'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import { formatPlanDisplayName } from '@/lib/invest/plan-mapper'
import { getPlanTheme } from '@/lib/invest/plan-config'
import { cn } from '@/lib/utils'

interface InvestPlansTableProps {
  plans: InvestmentPlan[]
  selectedPlanId?: string | null
  onSelect: (plan: InvestmentPlan) => void
  onInvest: (plan: InvestmentPlan) => void
}

function InvestPlansTable({
  plans,
  selectedPlanId,
  onSelect,
  onInvest,
}: InvestPlansTableProps) {
  const t = useTranslations('invest.table')
  if (!plans.length) return null

  return (
    <>
      {/* Desktop / tablet table */}
      <ScrollTable className="hidden md:block" ariaLabel="Investment plans table">
        <table className="w-full min-w-[680px] table-fixed text-sm">
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('plan')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('weeklyReturn')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('minimum')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('duration')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('payout')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('category')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {plans.map((plan, index) => (
              <PlanTableRow
                key={plan.id}
                plan={plan}
                index={index}
                selected={selectedPlanId === plan.id}
                onSelect={onSelect}
                onInvest={onInvest}
                labels={t}
              />
            ))}
          </tbody>
        </table>
      </ScrollTable>

      {/* Mobile list */}
      <div className="space-y-3 md:hidden">
        {plans.map((plan, index) => (
          <PlanMobileRow
            key={plan.id}
            plan={plan}
            index={index}
            selected={selectedPlanId === plan.id}
            onSelect={onSelect}
            onInvest={onInvest}
            labels={t}
          />
        ))}
      </div>
    </>
  )
}

function PlanTableRow({
  plan,
  index,
  selected,
  onSelect,
  onInvest,
  labels,
}: {
  plan: InvestmentPlan
  index: number
  selected: boolean
  onSelect: (plan: InvestmentPlan) => void
  onInvest: (plan: InvestmentPlan) => void
  labels: ReturnType<typeof useTranslations<'invest.table'>>
}) {
  const theme = getPlanTheme(plan, index)
  const Icon = theme.icon

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onSelect(plan)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(plan)
      }}
      className={cn(
        'cursor-pointer transition-colors hover:bg-gray-50/80',
        selected && 'bg-blue-50/50 ring-1 ring-inset ring-blue-100'
      )}
    >
      <td className="px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              theme.iconBg
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-gray-900">{plan.name}</span>
                  {plan.popular ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
                  <Star className="h-2.5 w-2.5 fill-white" />
                  {labels('popular')}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <span className={cn('text-base font-bold tabular-nums', theme.roiColor)}>{plan.weeklyRoi}</span>
        <p className="text-[11px] text-gray-500">{plan.weeklyRoiLabel}</p>
      </td>
      <td className="px-3 py-3.5 font-semibold text-gray-900">{plan.minInvestment}</td>
      <td className="px-3 py-3.5 text-gray-700">{plan.duration}</td>
      <td className="px-3 py-3.5 text-gray-700">{plan.payout}</td>
      <td className="px-3 py-3.5">
        <span
          className={cn(
            'inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide',
            theme.badge
          )}
        >
          {plan.category}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onInvest(plan)
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors',
            theme.button
          )}
        >
          {labels('invest')}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  )
}

function PlanMobileRow({
  plan,
  index,
  selected,
  onSelect,
  onInvest,
  labels,
}: {
  plan: InvestmentPlan
  index: number
  selected: boolean
  onSelect: (plan: InvestmentPlan) => void
  onInvest: (plan: InvestmentPlan) => void
  labels: ReturnType<typeof useTranslations<'invest.table'>>
}) {
  const theme = getPlanTheme(plan, index)
  const Icon = theme.icon

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(plan)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(plan)
      }}
      className={cn(
        'rounded-xl border p-4 transition-colors',
        selected ? 'border-blue-200 bg-blue-50/40 ring-1 ring-blue-100' : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', theme.iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{formatPlanDisplayName(plan.name)}</h3>
              {plan.popular ? (
                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
                  {labels('popular')}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                'mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide',
                theme.badge
              )}
            >
              {plan.category}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn('text-xl font-bold tabular-nums', theme.roiColor)}>{plan.weeklyRoi}</p>
          <p className="text-[10px] text-gray-500">{plan.weeklyRoiLabel}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-gray-500">{labels('minimum')}</dt>
          <dd className="font-semibold text-gray-900">{plan.minInvestment}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{labels('duration')}</dt>
          <dd className="font-semibold text-gray-900">{plan.duration}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{labels('payout')}</dt>
          <dd className="font-semibold text-gray-900">{plan.payout}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{labels('category')}</dt>
          <dd>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide',
                theme.badge
              )}
            >
              {plan.category}
            </span>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onInvest(plan)
        }}
        className={cn(
          'mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold',
          theme.button
        )}
      >
        {labels('investNow')}
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  )
}

export default memo(InvestPlansTable)
