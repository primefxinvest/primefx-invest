'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Lock, Sparkles } from 'lucide-react'
import {
  getInvestorTierConfig,
  getNextTier,
  type InvestorTierKey,
} from '@/lib/investor/tiers'
import type { InvestorFeature } from '@/lib/investor/types'
import { InvestorTierBadge } from './InvestorTierBadge'

interface UpgradePromptProps {
  currentTier: InvestorTierKey
  requiredTier: InvestorTierKey
  feature?: InvestorFeature
  title?: string
  description?: string
}

export function UpgradePrompt({
  currentTier,
  requiredTier,
  feature,
  title,
  description,
}: UpgradePromptProps) {
  const t = useTranslations('investor')
  const required = getInvestorTierConfig(requiredTier)
  const next = getNextTier(currentTier)
  const featureLabel = feature?.replace(/_/g, ' ') ?? t('thisModule')

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-gray-900">
        {title ?? t('unlockWith', { tier: required.label })}
      </h2>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        {description ??
          t('featureRequires', { tier: required.label, feature: featureLabel })}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <InvestorTierBadge tier={currentTier} />
        <span className="text-gray-400">→</span>
        <InvestorTierBadge tier={requiredTier} />
      </div>
      <p className="mt-3 text-xs text-gray-500">
        {required.badge}{' '}
        {t('minInvestment', {
          amount: required.minimumInvestment.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }),
          range: required.roiRange,
        })}
      </p>
      <Link
        href="/invest"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Sparkles className="h-4 w-4" />
        {next ? t('upgradeToTier', { tier: getInvestorTierConfig(next).label }) : t('viewPlans')}
      </Link>
    </div>
  )
}
