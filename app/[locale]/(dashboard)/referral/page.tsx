'use client'

import { ReferralProgramView } from '@/components/referral/ReferralProgramView'
import { ReferralProgramGate } from '@/components/referral/ReferralProgramGate'

export default function ReferralPage() {
  return (
    <ReferralProgramGate>
      <ReferralProgramView />
    </ReferralProgramGate>
  )
}
