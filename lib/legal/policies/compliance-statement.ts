import type { LegalDocument } from '@/lib/legal/types'

export const COMPLIANCE_STATEMENT: LegalDocument = {
  title: 'Compliance Statement',
  description: 'PrimeFx Invest regulatory compliance framework.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'framework',
      title: 'Compliance Framework',
      body: `PrimeFx Invest operates in accordance with international financial regulations including anti-money laundering (AML), know-your-customer (KYC), data protection (GDPR and equivalents), and consumer protection standards.`,
    },
    {
      id: 'aml-kyc',
      title: 'AML & KYC',
      body: `We maintain comprehensive AML and KYC programs with identity verification, transaction monitoring, sanctions screening, and suspicious activity reporting.`,
    },
    {
      id: 'data-protection',
      title: 'Data Protection',
      body: `Personal data is processed in compliance with applicable privacy laws. We implement data minimization, purpose limitation, and security-by-design principles.`,
    },
    {
      id: 'security',
      title: 'Security Standards',
      body: `Platform security includes 256-bit encryption, multi-factor authentication, session protection, fraud monitoring, and regular security assessments.`,
    },
    {
      id: 'reporting',
      title: 'Regulatory Reporting',
      body: `We cooperate with regulatory authorities and law enforcement as required by law. Compliance reports are filed according to jurisdictional requirements.`,
    },
  ],
}
