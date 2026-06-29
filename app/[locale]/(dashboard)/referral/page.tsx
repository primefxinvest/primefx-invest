'use client'

import { ReferralProgramView } from '@/components/referral/ReferralProgramView'
import { InvestorPageGate } from '@/components/investor/InvestorPageGate'

export default function ReferralPage() {
  return (
    <InvestorPageGate feature="referral_program" route="/referral">
      <ReferralProgramView />
    </InvestorPageGate>
  )
}
