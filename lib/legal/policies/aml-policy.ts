import type { LegalDocument } from '@/lib/legal/types'

export const AML_POLICY: LegalDocument = {
  title: 'Anti-Money Laundering Policy',
  description: 'PrimeFx Invest commitment to preventing money laundering and terrorist financing.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'commitment',
      title: 'AML Commitment',
      body: `PrimeFx Invest is committed to preventing money laundering, terrorist financing, and financial crime. We comply with applicable AML regulations and maintain policies aligned with international standards.`,
    },
    {
      id: 'monitoring',
      title: 'Transaction Monitoring',
      body: `All transactions are monitored for unusual patterns including rapid fund movement, structuring, sanctions list matches, and high-risk jurisdictions. Automated and manual reviews are conducted on flagged activity.`,
    },
    {
      id: 'reporting',
      title: 'Reporting Obligations',
      body: `We report suspicious activity to relevant financial intelligence units and regulatory authorities as required by law. Users may not be notified when a report is filed to preserve investigation integrity.`,
    },
    {
      id: 'verification',
      title: 'Verification Requirements',
      body: `All users must complete identity verification (KYC) before accessing deposits, withdrawals, and transfers. Enhanced due diligence applies to high-value accounts and politically exposed persons.`,
    },
    {
      id: 'suspicious',
      title: 'Suspicious Activity Procedures',
      body: `Accounts involved in suspected money laundering may be frozen pending investigation. PrimeFx Invest cooperates fully with law enforcement and may terminate accounts that violate AML policies.`,
    },
  ],
}
