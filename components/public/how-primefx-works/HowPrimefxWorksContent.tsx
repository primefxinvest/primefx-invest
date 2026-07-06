'use client'

import { ReadingProgressBar } from '@/components/public/ReadingProgressBar'
import { StickySectionNav } from '@/components/public/StickySectionNav'
import { HowPrimefxHeroSection } from './HeroSection'
import { HowPrimefxJourneySection } from './JourneySection'
import { HowPrimefxPlansSection } from './PlansSection'
import { HowPrimefxProfitsSection } from './ProfitsSection'
import { HowPrimefxMultipleInvestmentsSection } from './MultipleInvestmentsSection'
import { HowPrimefxReferralSection } from './ReferralSection'
import { HowPrimefxDepositSection } from './DepositSection'
import { HowPrimefxWithdrawalSection } from './WithdrawalSection'
import { HowPrimefxTransferSection } from './TransferSection'
import { HowPrimefxFeesSection } from './FeesSection'
import { HowPrimefxKycSection } from './KycSection'
import { HowPrimefxPrimeAiSection } from './PrimeAiSection'
import { HowPrimefxSecuritySection } from './SecuritySection'
import { HowPrimefxFaqSection } from './FaqSection'
import { HowPrimefxCtaSection } from './CtaSection'

const SECTION_NAV = [
  { id: 'investment-journey', label: 'Journey' },
  { id: 'investment-plans', label: 'Plans' },
  { id: 'how-profits-work', label: 'Profits' },
  { id: 'multiple-investments', label: 'Portfolio' },
  { id: 'referral-program', label: 'Referral' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'fees', label: 'Fees' },
  { id: 'verification', label: 'KYC' },
  { id: 'primeai', label: 'PrimeAI' },
  { id: 'security', label: 'Security' },
  { id: 'faq', label: 'FAQ' },
] as const

export function HowPrimefxWorksContent() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <ReadingProgressBar />
      <HowPrimefxHeroSection />
      <StickySectionNav sections={[...SECTION_NAV]} />
      <HowPrimefxJourneySection />
      <HowPrimefxPlansSection />
      <HowPrimefxProfitsSection />
      <HowPrimefxMultipleInvestmentsSection />
      <HowPrimefxReferralSection />
      <HowPrimefxDepositSection />
      <HowPrimefxWithdrawalSection />
      <HowPrimefxTransferSection />
      <HowPrimefxFeesSection />
      <HowPrimefxKycSection />
      <HowPrimefxPrimeAiSection />
      <HowPrimefxSecuritySection />
      <HowPrimefxFaqSection />
      <HowPrimefxCtaSection />
    </div>
  )
}
