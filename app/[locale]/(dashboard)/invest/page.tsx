'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { LayoutGrid, Scale, Star, Table2 } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PlanCardsSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import {
  AIRecommendationBanner,
  InvestHowItWorksPanel,
  InvestPlanCard,
  InvestPlansTable,
  InvestPrimeAIWidget,
  PlanCompareView,
  TrustFeaturesBar,
} from '@/components/invest/Invest.lazy'
import InvestModal from '@/components/invest/InvestModal'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { useInvestmentPlans } from '@/lib/hooks/useInvestmentPlans'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import { cn } from '@/lib/utils'
import { pageStackClass, gridGapClass, pageHeaderGapClass } from '@/lib/layout/spacing'
import { dashboardCardClass, dashboardMutedTextClass } from '@/lib/layout/surfaces'

const VIEW_MODE_IDS = ['table', 'grid', 'compare'] as const
type ViewMode = (typeof VIEW_MODE_IDS)[number]

export default function InvestPage() {
  const t = useTranslations('invest')
  const searchParams = useSearchParams()
  const { data: investmentPlans, loading: plansLoading, error: plansError, reload: reloadPlans } =
    useInvestmentPlans()

  const recommendedPlan = useMemo(
    () => investmentPlans.find((p) => p.popular) ?? investmentPlans[0] ?? null,
    [investmentPlans]
  )

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [modalPlan, setModalPlan] = useState<InvestmentPlan | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const kyc = useFinancialKycAccess()
  const recommendationRef = useRef<HTMLDivElement>(null)
  const deepLinkHandled = useRef(false)
  const defaultPlanSet = useRef(false)

  useEffect(() => {
    if (!recommendedPlan || defaultPlanSet.current) return
    setSelectedPlanId(recommendedPlan.id)
    defaultPlanSet.current = true
  }, [recommendedPlan])

  useEffect(() => {
    if (deepLinkHandled.current) return
    const planId = searchParams.get('plan')
    if (!planId || !investmentPlans.length || kyc.loading || !kyc.verified) return

    const plan = investmentPlans.find((p) => p.id === planId)
    if (plan) {
      deepLinkHandled.current = true
      setSelectedPlanId(plan.id)
      setModalPlan(plan)
      setModalOpen(true)
    }
  }, [searchParams, investmentPlans, kyc.loading, kyc.verified])

  const openInvestModal = useCallback(
    (plan: InvestmentPlan) => {
      if (!kyc.loading && !kyc.verified) {
        showKycRequiredToast({
          status: kyc.status,
          action: 'investment',
          fallback: kyc.summary ?? 'Complete KYC before investing.',
        })
        return
      }

      setModalPlan(plan)
      setModalOpen(true)
      setSelectedPlanId(plan.id)
    },
    [kyc.loading, kyc.verified, kyc.status, kyc.summary]
  )

  const handleInvestSuccess = useCallback((plan: InvestmentPlan, amount: number) => {
    toast.success(t('toast.confirmed'), {
      description: t('toast.confirmedDescription', {
        amount: `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        plan: plan.name,
      }),
    })
  }, [t])

  const viewModes = useMemo(
    () =>
      [
        { id: 'table' as const, label: t('viewModes.table'), icon: Table2 },
        { id: 'grid' as const, label: t('viewModes.grid'), icon: LayoutGrid },
        { id: 'compare' as const, label: t('viewModes.compare'), icon: Scale },
      ] as const,
    [t]
  )

  const scrollToRecommendation = useCallback(() => {
    if (!recommendedPlan) return
    recommendationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setSelectedPlanId(recommendedPlan.id)
  }, [recommendedPlan])

  const planSkeleton =
    viewMode === 'grid' ? (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlanCardsSkeleton count={4} />
      </div>
    ) : (
      <TableSkeleton rows={4} cols={6} />
    )

  return (
    <>
      <InvestModal
        plan={modalPlan}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleInvestSuccess}
      />

      <div className={cn('min-w-0', pageStackClass)}>
        <header className={cn('flex flex-col', pageHeaderGapClass)}>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t('title')}</h1>
            <p className={cn('mt-1 max-w-2xl', dashboardMutedTextClass)}>
              {t('subtitle')}
            </p>
          </div>
          <KycFinancialBanner />
        </header>

        <section aria-label="Investment plans" className={cn(dashboardCardClass, 'overflow-hidden')}>
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#0052ff]">
                <Star className="h-3 w-3 fill-[#0052ff]" aria-hidden />
                {t('plansAvailable', { count: investmentPlans.length })}
              </span>
              <h2 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">{t('sectionTitle')}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {t('sectionSubtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('viewModeLabel')}>
              {viewModes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={viewMode === id}
                  onClick={() => setViewMode(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052ff] focus-visible:ring-offset-2 sm:text-sm',
                    viewMode === id
                      ? 'border-[#0052ff] bg-[#0052ff] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AsyncState
            loading={plansLoading}
            error={plansError}
            onRetry={reloadPlans}
            isEmpty={investmentPlans.length === 0}
            emptyTitle={t('empty.title')}
            emptyDescription={t('empty.description')}
            skeleton={planSkeleton}
            compact
          >
            {viewMode === 'table' ? (
              <InvestPlansTable
                plans={investmentPlans}
                selectedPlanId={selectedPlanId}
                onSelect={(p) => setSelectedPlanId(p.id)}
                onInvest={openInvestModal}
              />
            ) : null}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {investmentPlans.map((plan, index) => (
                  <InvestPlanCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    selected={selectedPlanId === plan.id}
                    onSelect={(p) => setSelectedPlanId(p.id)}
                    onInvest={openInvestModal}
                  />
                ))}
              </div>
            ) : null}
            {viewMode === 'compare' ? (
              <PlanCompareView plans={investmentPlans} onInvest={openInvestModal} />
            ) : null}
          </AsyncState>
        </section>

        <div className={cn('grid grid-cols-1 items-start', gridGapClass, 'xl:grid-cols-[minmax(0,1fr)_260px]')}>
          <div className="min-w-0 space-y-6">
            {recommendedPlan ? (
              <section aria-label="Plan recommendation" ref={recommendationRef}>
                <AIRecommendationBanner
                  recommendedPlan={recommendedPlan}
                  onGetRecommendation={scrollToRecommendation}
                  onInvestRecommended={() => openInvestModal(recommendedPlan)}
                />
              </section>
            ) : null}

            <section aria-label="How investing works">
              <InvestHowItWorksPanel />
            </section>

            <TrustFeaturesBar />
          </div>

          <aside className="min-w-0 xl:sticky xl:top-6">
            <InvestPrimeAIWidget />
          </aside>
        </div>
      </div>
    </>
  )
}
