export { TERMS_OF_SERVICE } from './terms-of-service'
export { PRIVACY_POLICY } from './privacy-policy'
export { RISK_DISCLOSURE } from './risk-disclosure'
export { COOKIE_POLICY } from './cookie-policy'
export { AML_POLICY } from './aml-policy'
export { KYC_POLICY } from './kyc-policy'
export { REFUND_POLICY } from './refund-policy'
export { COMPLIANCE_STATEMENT } from './compliance-statement'
export { DATA_PROCESSING } from './data-processing'
export { INVESTOR_RESPONSIBILITIES } from './investor-responsibilities'

export interface LegalHubDocument {
  slug: string
  title: string
  description: string
  href: string
}

export const LEGAL_HUB_DOCUMENTS: LegalHubDocument[] = [
  { slug: 'terms', title: 'Terms of Service', description: 'Platform terms, account rules, and investment conditions', href: '/terms' },
  { slug: 'privacy', title: 'Privacy Policy', description: 'How we collect, use, and protect your data', href: '/privacy' },
  { slug: 'risk-disclosure', title: 'Risk Disclosure', description: 'Investment and platform risk information', href: '/risk-disclosure' },
  { slug: 'cookies', title: 'Cookie Policy', description: 'Cookies and tracking technologies', href: '/cookies' },
  { slug: 'aml-policy', title: 'AML Policy', description: 'Anti-money laundering commitment and procedures', href: '/aml-policy' },
  { slug: 'kyc-policy', title: 'KYC Policy', description: 'Identity verification requirements', href: '/kyc-policy' },
  { slug: 'refund-policy', title: 'Refund Policy', description: 'Deposit and withdrawal refund conditions', href: '/legal#refund-policy' },
  { slug: 'compliance', title: 'Compliance Statement', description: 'Regulatory compliance framework', href: '/legal#compliance' },
  { slug: 'data-processing', title: 'Data Processing', description: 'How personal data is processed', href: '/legal#data-processing' },
  { slug: 'investor-responsibilities', title: 'Investor Responsibilities', description: 'Your obligations as an investor', href: '/legal#investor-responsibilities' },
]
