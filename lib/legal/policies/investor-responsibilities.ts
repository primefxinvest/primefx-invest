import type { LegalDocument } from '@/lib/legal/types'

export const INVESTOR_RESPONSIBILITIES: LegalDocument = {
  title: 'Investor Responsibilities',
  description: 'Your obligations and responsibilities as a PrimeFx Invest account holder.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'due-diligence',
      title: 'Due Diligence',
      body: `You are responsible for understanding investment risks, reading all terms and disclosures, and making informed decisions based on your financial situation and risk tolerance.`,
    },
    {
      id: 'accuracy',
      title: 'Accurate Information',
      body: `You must provide truthful, complete, and current information during registration and KYC verification. Providing false information may result in account termination.`,
    },
    {
      id: 'security',
      title: 'Account Security',
      body: `Protect your login credentials, enable multi-factor authentication, use strong passwords, and report unauthorized access immediately.`,
    },
    {
      id: 'compliance',
      title: 'Legal Compliance',
      body: `You must comply with all applicable laws in your jurisdiction regarding investments, taxation, and cryptocurrency use. PrimeFx Invest does not provide tax advice.`,
    },
    {
      id: 'wallet-addresses',
      title: 'Wallet Addresses',
      body: `You are solely responsible for verifying cryptocurrency wallet addresses before deposits and withdrawals. Transactions to incorrect addresses cannot be reversed.`,
    },
    {
      id: 'prohibited',
      title: 'Prohibited Conduct',
      body: `You may not use the platform for money laundering, fraud, market manipulation, sanctions evasion, or any illegal activity. Violations result in immediate account suspension.`,
    },
  ],
}
