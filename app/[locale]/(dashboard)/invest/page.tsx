'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { LayoutGrid, Scale, Star, Table2 } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PlanCardsSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { loadInvestmentPlans } from '@/lib/invest/plan-actions'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import InvestPlanCard from '@/components/invest/InvestPlanCard'
import InvestPlansTable from '@/components/invest/InvestPlansTable'
import InvestHowItWorksPanel from '@/components/invest/InvestHowItWorksPanel'
import PlanCompareView from '@/components/invest/PlanCompareView'
import InvestModal from '@/components/invest/InvestModal'
import TrustFeaturesBar from '@/components/invest/TrustFeaturesBar'
import AIRecommendationBanner from '@/components/invest/AIRecommendationBanner'
import InvestPrimeAIWidget from '@/components/invest/InvestPrimeAIWidget'
import { InvestDisclaimer } from '@/components/invest/InvestDisclaimer'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { cn } from '@/lib/utils'
import { pageStackClass } from '@/lib/layout/spacing'

type ViewMode = 'table' | 'grid' | 'compare'

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof Table2 }[] = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'grid', label: 'Cards', icon: LayoutGrid },
  { id: 'compare', label: 'Compare', icon: Scale },
]

export default function InvestPage() {
  const searchParams = useSearchParams()
  const { data: investmentPlans = [], loading: plansLoading, error: plansError, reload: reloadPlans } =
    useAsyncData(() => loadInvestmentPlans(), [])
  const recommendedPlan =
    investmentPlans.find((p) => p.popular) ?? investmentPlans[0] ?? null

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [modalPlan, setModalPlan] = useState<InvestmentPlan | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const kyc = useFinancialKycAccess()
  const recommendationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (recommendedPlan && !selectedPlanId) {
      setSelectedPlanId(recommendedPlan.id)
    }
  }, [recommendedPlan, selectedPlanId])

  useEffect(() => {
    const planId = searchParams.get('plan')
    if (!planId || !investmentPlans.length || kyc.loading || !kyc.verified) return

    const plan = investmentPlans.find((p) => p.id === planId)
    if (plan) {
      setSelectedPlanId(plan.id)
      setModalPlan(plan)
      setModalOpen(true)
    }
  }, [searchParams, investmentPlans, kyc.loading, kyc.verified])

  const openInvestModal = (plan: InvestmentPlan) => {
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
  }

  const handleInvestSuccess = (plan: InvestmentPlan, amount: number) => {
    toast.success('Investment confirmed', {
      description: `Successfully invested $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} in ${plan.name}.`,
    })
  }

  const scrollToRecommendation = () => {
    if (!recommendedPlan) return
    recommendationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setSelectedPlanId(recommendedPlan.id)
  }

  return (
    <>
      <InvestModal
        plan={modalPlan}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleInvestSuccess}
      />

      <div className={pageStackClass}>
        <header className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invest</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Compare plans, pick one that matches your goals, and invest from your wallet.
            </p>
          </div>
          <KycFinancialBanner />
        </header>

        {/* Primary: investment plans */}
        <section aria-label="Investment plans" className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#0052ff]">
                <Star className="h-3 w-3 fill-[#0052ff]" />
                {investmentPlans.length} PLANS AVAILABLE
              </span>
              <h2 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">Investment Plans</h2>
              <p className="mt-1 text-sm text-gray-500">
                Weekly returns, minimums, and payout schedule — select a plan then invest
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Plan view mode">
              {VIEW_MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={viewMode === id}
                  onClick={() => setViewMode(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                    viewMode === id
                      ? 'border-[#0052ff] bg-[#0052ff] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
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
            emptyTitle="No investment plans"
            emptyDescription="Plans will appear here once they are configured in your account."
            skeleton={
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                  <PlanCardsSkeleton count={4} />
                </div>
              ) : (
                <TableSkeleton rows={4} cols={6} />
              )
            }
            compact
          >
            {viewMode === 'table' ? (
              <InvestPlansTable
                plans={investmentPlans}
                selectedPlanId={selectedPlanId}
                onSelect={(p) => setSelectedPlanId(p.id)}
                onInvest={openInvestModal}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
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
            ) : (
              <PlanCompareView plans={investmentPlans} onInvest={openInvestModal} />
            )}
          </AsyncState>
        </section>

        <InvestDisclaimer />

        <section aria-label="How investing works">
          <InvestHowItWorksPanel />
        </section>

        <TrustFeaturesBar />

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
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
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <InvestPrimeAIWidget />
          </aside>
        </div>
      </div>
    </>
  )
}
