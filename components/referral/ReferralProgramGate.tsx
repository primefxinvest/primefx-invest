'use client'

import { Loader2 } from 'lucide-react'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { useReferralProgramEnabled } from '@/lib/hooks/useReferralProgramEnabled'
import { canAccessFeature } from '@/lib/investor/tiers'
import { UpgradePrompt } from '@/components/investor/UpgradePrompt'
import { ReferralLockedView } from '@/components/referral/ReferralLockedView'

interface ReferralProgramGateProps {
  children: React.ReactNode
}

export function ReferralProgramGate({ children }: ReferralProgramGateProps) {
  const { loading: tierLoading, tierKey } = useInvestorTier()
  const { enabled, loading: programLoading } = useReferralProgramEnabled()

  if (tierLoading || programLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0052ff]" />
      </div>
    )
  }

  if (!canAccessFeature(tierKey, 'referral_program')) {
    return (
      <UpgradePrompt currentTier={tierKey} requiredTier="growth" feature="referral_program" />
    )
  }

  if (!enabled) {
    return <ReferralLockedView />
  }

  return children
}
