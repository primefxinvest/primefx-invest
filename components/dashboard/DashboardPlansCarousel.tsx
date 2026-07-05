'use client'

import { memo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  ChevronRight,
  Crown,
  Gem,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useInvestmentPlans } from '@/lib/hooks/useInvestmentPlans'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function useRiskLabel(t: ReturnType<typeof useTranslations<'dashboard'>>) {
  return useCallback(
    (plan: { riskLevel: string }) => {
      if (plan.riskLevel === 'Low') return t('riskLow')
      if (plan.riskLevel === 'Medium') return t('riskMedium')
      if (plan.riskLevel === 'Very High') return t('riskVeryHigh')
      if (plan.riskLevel === 'High') return t('riskHigh')
      return t('riskGeneric', { level: plan.riskLevel })
    },
    [t]
  )
}

function getPlanVisuals(plan: { name: string; popular?: boolean; riskLevel: string }) {
  const name = plan.name.toLowerCase()
  let Icon: LucideIcon = TrendingUp
  let iconBg = 'bg-primary/10 text-primary'
  let badgeClass = 'bg-muted text-muted-foreground'

  if (name.includes('starter')) {
    Icon = Sprout
    iconBg = 'bg-emerald-50 text-emerald-600'
    badgeClass = 'bg-emerald-50 text-emerald-700'
  } else if (name.includes('growth')) {
    Icon = TrendingUp
    iconBg = 'bg-blue-50 text-[#0052ff]'
    badgeClass = 'bg-blue-50 text-[#0052ff]'
  } else if (name.includes('prime')) {
    Icon = Crown
    iconBg = 'bg-[#7c3aed]/10 text-[#7c3aed]'
    badgeClass = 'bg-[#7c3aed]/10 text-[#7c3aed]'
  } else if (name.includes('elite')) {
    Icon = Gem
    iconBg = 'bg-orange-50 text-orange-600'
    badgeClass = 'bg-orange-50 text-orange-700'
  }

  if (plan.popular) {
    badgeClass = 'bg-[#7c3aed] text-white'
  }

  const riskClass =
    plan.riskLevel === 'Low'
      ? 'text-emerald-600'
      : plan.riskLevel === 'Medium'
        ? 'text-[#0052ff]'
        : plan.riskLevel === 'High' || plan.riskLevel === 'Very High'
          ? 'text-[#7c3aed]'
          : 'text-muted-foreground'

  return { Icon, iconBg, badgeClass, riskClass }
}

type PlanData = {
  id: string
  name: string
  weeklyRoi: string
  weeklyRoiLabel: string
  minInvestment: string
  duration: string
  payout: string
  badge: string
  popular?: boolean
  riskLevel: string
}

function PlanDetailRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className={cn('truncate text-xs font-semibold text-foreground', valueClassName)}>{value}</p>
    </div>
  )
}

const PlanCard = memo(function PlanCard({
  plan,
  riskLabel,
  investLabel,
  minLabel,
  durationLabel,
  payoutLabel,
  riskLevelLabel,
}: {
  plan: PlanData
  riskLabel: string
  investLabel: string
  minLabel: string
  durationLabel: string
  payoutLabel: string
  riskLevelLabel: string
}) {
  const { Icon, iconBg, badgeClass, riskClass } = getPlanVisuals(plan)

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
      <span
        className={cn(
          'line-clamp-2 w-full rounded-md px-2 py-1 text-center text-[8px] font-bold uppercase leading-tight tracking-wide',
          badgeClass
        )}
      >
        {plan.badge}
      </span>

      <div className="mt-3 flex flex-1 flex-col min-w-0">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        <h3 className="mt-3 truncate text-sm font-bold text-foreground">{plan.name}</h3>

        <div className="mt-2 min-w-0">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{plan.weeklyRoi}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{plan.weeklyRoiLabel}</p>
        </div>

        <div className="mt-4 space-y-2.5 border-t border-border/60 pt-3">
          <PlanDetailRow label={minLabel} value={plan.minInvestment} />
          <PlanDetailRow label={durationLabel} value={plan.duration} />
          <PlanDetailRow label={payoutLabel} value={plan.payout} />
          <PlanDetailRow label={riskLevelLabel} value={riskLabel} valueClassName={riskClass} />
        </div>
      </div>

      <Link
        href={`/invest?plan=${plan.id}`}
        className="mt-4 flex min-h-10 w-full shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {investLabel}
      </Link>
    </article>
  )
})

function DashboardPlansCarouselInner({ className }: { className?: string }) {
  const t = useTranslations('dashboard')
  const riskLabelFn = useRiskLabel(t)
  const { data: plans, loading, error, reload } = useInvestmentPlans()

  return (
    <section
      aria-labelledby="dashboard-plans-heading"
      className={cn(dashboardCardClass, 'flex h-full min-w-0 flex-col', className)}
    >
      <DashboardSectionHeader
        title={t('topPlans')}
        action={
          <Link
            href="/invest"
            className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('viewAllPlans')}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
        className="mb-0 shrink-0"
      />
      <h2 id="dashboard-plans-heading" className="sr-only">
        {t('topPlans')}
      </h2>

      <div className="mt-4 min-h-0 flex-1">
        <AsyncState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!plans?.length}
          emptyTitle={t('noPlansTitle')}
          emptyDescription={t('noPlansDesc')}
          emptyAction={
            <Link
              href="/invest"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
            >
              {t('viewInvestPage')}
            </Link>
          }
          skeleton={<PlanCardsSkeleton />}
          compact
        >
          <div
            className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            role="list"
            aria-label={t('topPlans')}
          >
            {plans?.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                riskLabel={riskLabelFn(plan)}
                investLabel={t('investNow')}
                minLabel={t('planMin')}
                durationLabel={t('planDuration')}
                payoutLabel={t('planPayout')}
                riskLevelLabel={t('planRisk')}
              />
            ))}
          </div>
        </AsyncState>
      </div>
    </section>
  )
}

export default memo(DashboardPlansCarouselInner)
