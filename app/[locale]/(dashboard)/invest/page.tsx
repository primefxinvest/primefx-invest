'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Bot,
  Headphones,
  LayoutGrid,
  Scale,
  Shield,
  Star,
  Table2,
  Wallet,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { PlanCardsSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { loadInvestmentPlans } from '@/lib/invest/plan-actions'
import { fetchMarketOverview } from '@/lib/data/queries'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import InvestPlanCard from '@/components/invest/InvestPlanCard'
import InvestPlansTable from '@/components/invest/InvestPlansTable'
import InvestHowItWorksPanel from '@/components/invest/InvestHowItWorksPanel'
import PlanCompareView from '@/components/invest/PlanCompareView'
import InvestModal from '@/components/invest/InvestModal'
import TrustFeaturesBar from '@/components/invest/TrustFeaturesBar'
import AIRecommendationBanner from '@/components/invest/AIRecommendationBanner'
import InvestPrimeAIWidget from '@/components/invest/InvestPrimeAIWidget'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import WhyInvestWidget from '@/components/invest/WhyInvestWidget'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'grid' | 'compare'

const featureHighlights = [
  {
    icon: Bot,
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'AI-Powered Strategies',
    description: 'Advanced AI models analyze the market 24/7 to find the best opportunities.',
  },
  {
    icon: Shield,
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'Secure & Trusted',
    description: 'Bank-level security to protect your funds.',
  },
  {
    icon: Wallet,
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Daily Payouts',
    description: 'Profits credited every trading day (Mon–Fri).',
  },
  {
    icon: Headphones,
    iconBg: 'bg-orange-100 text-orange-600',
    title: '24/7 Support',
    description: 'Our team is always here to help you.',
  },
]

export default function InvestPage() {
  const searchParams = useSearchParams()
  const { data: investmentPlans = [], loading: plansLoading, error: plansError, reload: reloadPlans } =
    useAsyncData(() => loadInvestmentPlans(), [])
  const { data: marketOverview = [], loading: marketLoading, error: marketError, reload: reloadMarket } =
    useAsyncData(() => fetchMarketOverview(), [])
  const recommendedPlan =
    investmentPlans.find((p) => p.popular) ?? investmentPlans[0] ?? null

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [modalPlan, setModalPlan] = useState<InvestmentPlan | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const kyc = useFinancialKycAccess()
  const howItWorksRef = useRef<HTMLDivElement>(null)
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

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invest</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Compare plans in the table below, pick one that matches your goals, and invest from your wallet.
            </p>
          </div>

          <KycFinancialBanner />
        </div>

        <div ref={howItWorksRef}>
          <InvestHowItWorksPanel />
        </div>

        {/* Investment plans — table first */}
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#0052ff]">
                <Star className="h-3 w-3 fill-[#0052ff]" />
                {investmentPlans.length} PLANS AVAILABLE
              </span>
              <h2 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">Investment Plans</h2>
              <p className="mt-1 text-sm text-gray-500">
                Weekly returns, minimums, and payout schedule — select a row then click Invest
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                  viewMode === 'table'
                    ? 'border-[#0052ff] bg-[#0052ff] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                  viewMode === 'grid'
                    ? 'border-[#0052ff] bg-[#0052ff] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                  viewMode === 'compare'
                    ? 'border-[#0052ff] bg-[#0052ff] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                <Scale className="h-3.5 w-3.5" />
                Compare
              </button>
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
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {featureHighlights.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4"
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg sm:mb-3 sm:h-9 sm:w-9 ${feature.iconBg}`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <h3 className="text-xs font-semibold text-gray-900 sm:text-sm">{feature.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 sm:text-xs">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <TrustFeaturesBar />

            {recommendedPlan ? (
              <div ref={recommendationRef}>
                <AIRecommendationBanner
                  recommendedPlan={recommendedPlan}
                  onGetRecommendation={scrollToRecommendation}
                  onInvestRecommended={() => openInvestModal(recommendedPlan)}
                />
              </div>
            ) : null}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <InvestPrimeAIWidget />
            <AsyncState
              loading={marketLoading}
              error={marketError}
              onRetry={reloadMarket}
              isEmpty={!marketOverview.length}
              emptyTitle="No market data"
              emptyDescription="Market prices will appear once assets are configured."
              skeleton={<PlanCardsSkeleton count={1} />}
              compact
            >
              <MarketOverviewWidget markets={marketOverview} />
            </AsyncState>
            <WhyInvestWidget />
          </aside>
        </div>
      </div>
    </>
  )
}
