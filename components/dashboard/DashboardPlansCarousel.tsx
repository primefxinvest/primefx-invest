'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PlanCardsSkeleton } from '@/components/shared/skeletons'
import { useInvestmentPlans } from '@/lib/hooks/useInvestmentPlans'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { dashboardCardClass } from '@/lib/layout/surfaces'
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
      riskClass: 'bg-[#7c3aed]/10 text-[#7c3aed]',
      borderClass: 'border-primary ring-2 ring-primary/20',
    }
  }
  if (plan.riskLevel === 'Low') {
    return { riskClass: 'bg-emerald-50 text-emerald-700', borderClass: 'border-emerald-200' }
  }
  if (plan.riskLevel === 'Medium') {
    return { riskClass: 'bg-orange-50 text-orange-700', borderClass: 'border-orange-200' }
  }
  if (plan.riskLevel === 'High' || plan.riskLevel === 'Very High') {
    return { riskClass: 'bg-[#7c3aed]/10 text-[#7c3aed]', borderClass: 'border-[#7c3aed]/30' }
  }
  return { riskClass: 'bg-muted text-muted-foreground', borderClass: 'border-border' }
}

export default function DashboardPlansCarousel() {
  const t = useTranslations('dashboard')
  const riskLabel = useRiskLabel(t)
  const { data: plans, loading, error, reload } = useInvestmentPlans()
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
    <section aria-labelledby="dashboard-plans-heading" className={dashboardCardClass}>
      <DashboardSectionHeader
        title={t('topPlans')}
        action={
          <Link
            href="/invest"
            className="inline-flex min-h-11 items-center gap-0.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg px-1"
          >
            {t('viewAllPlans')}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
        className="mb-0"
      />
      <h2 id="dashboard-plans-heading" className="sr-only">
        {t('topPlans')}
      </h2>

      <div className="mt-4">
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
          <>
            {/* Mobile: vertical stack — no horizontal scroll */}
            <div className="space-y-3 md:hidden" role="list" aria-label={t('topPlans')}>
              {plans?.map((plan) => {
                const style = getPlanStyle(plan)
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    style={style}
                    riskLabel={riskLabel(plan)}
                    t={t}
                    className="w-full"
                  />
                )
              })}
            </div>

            {/* Tablet+: horizontal carousel */}
            <div
              ref={scrollRef}
              className="hidden snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 scrollbar-hide md:flex"
              role="list"
              aria-label={t('topPlans')}
              onScroll={(e) => {
                const container = e.currentTarget
                const cardWidth = container.firstElementChild?.clientWidth ?? container.offsetWidth
                const index = Math.round(container.scrollLeft / (cardWidth + 16))
                setActiveIndex(Math.min(Math.max(index, 0), (plans?.length ?? 1) - 1))
              }}
            >
              {plans?.map((plan) => {
                const style = getPlanStyle(plan)
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    style={style}
                    riskLabel={riskLabel(plan)}
                    t={t}
                    className="w-[min(220px,40vw)] shrink-0 snap-start"
                  />
                )
              })}
            </div>

            <div className="mt-4 hidden justify-center gap-1 md:flex">
              {plans?.map((plan, idx) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                  aria-label={t('goToPlan', { name: plan.name })}
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-all',
                      activeIndex === idx ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
          </>
        </AsyncState>
      </div>
    </section>
  )
}

function PlanCard({
  plan,
  style,
  riskLabel,
  t,
  className,
}: {
  plan: {
    id: string
    name: string
    weeklyRoi: string
    weeklyRoiLabel: string
    minInvestment: string
    popular?: boolean
  }
  style: { riskClass: string; borderClass: string }
  riskLabel: string
  t: ReturnType<typeof useTranslations<'dashboard'>>
  className?: string
}) {
  return (
    <div
      role="listitem"
      className={cn(
        'relative rounded-xl border bg-card p-4 shadow-sm',
        style.borderClass,
        plan.popular && 'bg-[#7c3aed]/5',
        className
      )}
    >
      {plan.popular ? (
        <span className="absolute -top-2.5 left-4 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold text-white">
          {t('mostPopular')}
        </span>
      ) : null}

      <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
      <p className="mt-1.5 text-xl font-bold text-foreground">{plan.weeklyRoi}</p>
      <p className="text-xs text-muted-foreground">{plan.weeklyRoiLabel}</p>

      <span
        className={cn(
          'mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
          style.riskClass
        )}
      >
        {riskLabel}
      </span>

      <p className="mt-3 text-xs text-muted-foreground">
        {t('minShort')}{' '}
        <span className="font-semibold text-foreground">{plan.minInvestment}</span>
      </p>

      <Link
        href={`/invest?plan=${plan.id}`}
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {t('investNow')}
      </Link>
    </div>
  )
}
