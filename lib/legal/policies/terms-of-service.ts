import type { LegalDocument } from '@/lib/legal/types'
import { INVESTMENT_TERMS_SECTIONS } from '@/lib/legal/investment-terms'

const PLATFORM_SECTIONS = [
  {
    id: 'eligibility',
    title: 'Account Eligibility',
    body: `You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to open a PrimeFx Invest account. By registering, you represent that you are legally permitted to use investment services in your country of residence and that all information you provide is accurate and complete.`,
  },
  {
    id: 'responsibilities',
    title: 'Account Responsibilities',
    body: `You are responsible for maintaining the confidentiality of your login credentials, enabling multi-factor authentication where available, and notifying PrimeFx Invest immediately of any unauthorized access. You must not share your account or allow third parties to operate it on your behalf without written authorization.`,
  },
  {
    id: 'investment-risks',
    title: 'Investment Risks',
    body: `All investments carry risk, including the possible loss of principal. Target returns displayed on the platform are illustrative and not guarantees. Market conditions, liquidity, and operational factors may affect actual performance. You should only invest funds you can afford to lose.`,
  },
  {
    id: 'referral-rules',
    title: 'Referral Rules',
    body: `Referral commissions are governed by the published referral program terms. Misrepresentation, self-referrals, fraudulent sign-ups, or manipulation of referral metrics may result in commission forfeiture and account suspension. Referral income is not guaranteed and depends on referred member activity.`,
  },
  {
    id: 'withdrawal-rules',
    title: 'Withdrawal Rules',
    body: `Withdrawal requests are subject to identity verification, security review, and published notice periods for principal returns. PrimeFx Invest reserves the right to delay or reject withdrawals that trigger fraud alerts, compliance reviews, or violate platform terms.`,
  },
  {
    id: 'platform-usage',
    title: 'Platform Usage',
    body: `You agree to use PrimeFx Invest only for lawful purposes. Prohibited activities include money laundering, market manipulation, unauthorized automated access, reverse engineering, and any conduct that harms platform integrity or other users.`,
  },
  {
    id: 'security-obligations',
    title: 'Security Obligations',
    body: `Users must comply with security requirements including KYC verification for financial operations, accurate wallet addresses, and cooperation with fraud investigations. Failure to comply may restrict account features.`,
  },
  {
    id: 'fraud-prevention',
    title: 'Fraud Prevention',
    body: `PrimeFx Invest monitors transactions for suspicious activity. Accounts involved in fraud, chargebacks, identity theft, or sanctions violations may be frozen, reported to authorities, and permanently closed.`,
  },
  {
    id: 'limitations',
    title: 'Service Limitations',
    body: `The platform is provided on an "as available" basis. PrimeFx Invest does not guarantee uninterrupted access, error-free operation, or specific investment outcomes. Scheduled maintenance and force majeure events may affect availability.`,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: `All platform content, trademarks, software, and branding are owned by PrimeFx Invest or its licensors. You may not copy, distribute, or create derivative works without prior written consent.`,
  },
  {
    id: 'suspension',
    title: 'Suspension Policy',
    body: `PrimeFx Invest may suspend or terminate accounts that violate these terms, pose security risks, or are required by law. Upon termination, you may withdraw eligible balances subject to compliance review and applicable fees.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    body: `These Terms are governed by applicable international financial and consumer protection frameworks. Disputes shall be resolved through good-faith negotiation, followed by binding arbitration or competent courts as specified in your jurisdiction's applicable regulations.`,
  },
] as const

export const TERMS_OF_SERVICE: LegalDocument = {
  title: 'Terms of Service',
  description: 'PrimeFx Invest platform terms governing account use, investments, referrals, and withdrawals.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    ...PLATFORM_SECTIONS,
    ...INVESTMENT_TERMS_SECTIONS.map((s) => ({
      id: s.id,
      title: s.title,
      body: s.body,
    })),
  ],
}
