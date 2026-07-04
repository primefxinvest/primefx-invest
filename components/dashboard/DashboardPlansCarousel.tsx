'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { loadInvestmentPlans } from '@/lib/invest/plan-actions'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function useRiskLabel(t: ReturnType<typeof useTranslations<'dashboard'>>) {
  return (plan: { riskLevel: string }) => {
    if (plan.riskLevel === 'Low') return t('riskLow')
    if (plan.riskLevel === 'Medium') return t('riskMedium')
    if (plan.riskLevel === 'Very High') return t('riskVeryHigh')
    if (plan.riskLevel === 'High') return t('riskHigh')
    return t('riskGeneric', { level: plan.riskLevel })
  }
}

function getPlanStyle(plan: { popular?: boolean; riskLevel: string }) {
  if (plan.popular) {
    return {
      riskClass: 'bg-red-100 text-red-600',
      borderClass: 'border-[#0052ff] ring-2 ring-[#0052ff]/30',
    }
  }
  if (plan.riskLevel === 'Low') {
    return { riskClass: 'bg-emerald-100 text-emerald-700', borderClass: 'border-emerald-200' }
  }
  if (plan.riskLevel === 'Medium') {
    return { riskClass: 'bg-orange-100 text-orange-700', borderClass: 'border-orange-200' }
  }
  if (plan.riskLevel === 'High' || plan.riskLevel === 'Very High') {
    return { riskClass: 'bg-purple-100 text-purple-700', borderClass: 'border-purple-200' }
  }
  return { riskClass: 'bg-red-100 text-red-600', borderClass: 'border-red-200' }
}

export default function DashboardPlansCarousel() {
  const t = useTranslations('dashboard')
  const riskLabel = useRiskLabel(t)
  const { data: plans, loading, error, reload } = useAsyncData(
    () => loadInvestmentPlans(),
    [],
    undefined,
    { cacheKey: 'dashboard-investment-plans', cacheTtlMs: 60_000 }
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current
    if (!container || !plans?.length) return
    const card = container.children[index] as HTMLElement | undefined
    if (card) {
      container.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' })
      setActiveIndex(index)
    }
  }

  return (
    <div className={dashboardCardClass}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={dashboardSectionTitleClass}>{t('topPlans')}</h2>
        <Link
          href="/invest"
          className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
        >
          {t('viewAllPlans')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!plans?.length}
        emptyTitle={t('noPlansTitle')}
        emptyDescription={t('noPlansDesc')}
        emptyAction={
          <Link href="/invest" className="text-sm font-semibold text-primary hover:underline">
            {t('viewInvestPage')}
          </Link>
        }
        skeleton={<PlanCardsSkeleton />}
        compact
      >
        <>
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide"
            onScroll={(e) => {
              const container = e.currentTarget
              const index = Math.round(container.scrollLeft / (container.offsetWidth * 0.45))
              setActiveIndex(Math.min(index, (plans?.length ?? 1) - 1))
            }}
          >
            {plans?.map((plan) => {
              const style = getPlanStyle(plan)
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative min-w-[180px] flex-shrink-0 snap-start rounded-xl border bg-card p-3.5 sm:min-w-[200px]',
                    style.borderClass,
                    plan.popular && 'bg-purple-50/30'
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-2.5 py-0.5 text-[9px] font-bold text-white">
                      {t('mostPopular')}
                    </span>
                  )}

                  <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1.5 text-lg font-bold text-foreground">{plan.weeklyRoi}</p>
                  <p className="text-[10px] text-muted-foreground">{plan.weeklyRoiLabel}</p>

                  <span
                    className={cn(
                      'mt-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      style.riskClass
                    )}
                  >
                    {riskLabel(plan)}
                  </span>

                  <p className="mt-3 text-[11px] text-gray-500">
                    {t('minShort')}{' '}
                    <span className="font-semibold text-gray-800">{plan.minInvestment}</span>
                  </p>

                  <Link
                    href={`/invest?plan=${plan.id}`}
                    className="mt-4 block w-full rounded-lg bg-primary py-2 text-center text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t('investNow')}
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex justify-center gap-1.5">
            {plans?.map((plan, idx) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  activeIndex === idx ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                )}
                aria-label={t('goToPlan', { name: plan.name })}
              />
            ))}
          </div>
        </>
      </AsyncState>
    </div>
  )
}
