import type { LegalDocument } from '@/lib/legal/types'

export const DATA_PROCESSING: LegalDocument = {
  title: 'Data Processing Information',
  description: 'Details on how PrimeFx Invest processes personal data.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'controller',
      title: 'Data Controller',
      body: `PrimeFx Invest acts as the data controller for personal information collected through the platform. For data protection inquiries, contact support@primefxinvest.com.`,
    },
    {
      id: 'purposes',
      title: 'Processing Purposes',
      body: `Data is processed for account management, transaction processing, identity verification, fraud prevention, customer support, legal compliance, platform improvement, and essential communications.`,
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis',
      body: `Processing is based on contract performance (providing services), legal obligations (AML/KYC compliance), legitimate interests (fraud prevention, security), and consent where required (marketing communications, non-essential cookies).`,
    },
    {
      id: 'processors',
      title: 'Data Processors',
      body: `We engage certified third-party processors for identity verification (Didit), payment processing, cloud hosting, and analytics. All processors are bound by data processing agreements.`,
    },
    {
      id: 'transfers',
      title: 'International Transfers',
      body: `Data may be transferred internationally with appropriate safeguards including encryption, access controls, and standard contractual clauses.`,
    },
    {
      id: 'retention',
      title: 'Retention Periods',
      body: `Account data is retained while active and for regulatory periods after closure. KYC documents are retained per AML requirements (typically 5–7 years).`,
    },
  ],
}
