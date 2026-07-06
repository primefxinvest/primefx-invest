import type { LegalDocument } from '@/lib/legal/types'

export const KYC_POLICY: LegalDocument = {
  title: 'KYC Policy',
  description: 'Identity verification requirements and procedures at PrimeFx Invest.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'purpose',
      title: 'Why Verification Exists',
      body: `Know Your Customer (KYC) verification protects investors, prevents fraud, ensures regulatory compliance, and maintains the integrity of the PrimeFx Invest platform. Verification is required before financial operations.`,
    },
    {
      id: 'identity',
      title: 'Identity Protection',
      body: `Verified identity ensures that only authorized individuals access your account for withdrawals and transfers. This protects your funds from unauthorized access and identity theft.`,
    },
    {
      id: 'fraud',
      title: 'Fraud Prevention',
      body: `KYC helps detect synthetic identities, document forgery, and account takeover attempts. Our verification partner Didit uses document analysis and liveness detection technology.`,
    },
    {
      id: 'withdrawals',
      title: 'Withdrawal Protection',
      body: `Withdrawals are restricted to verified accounts to prevent stolen funds from leaving the platform. This protects both individual users and the broader investor community.`,
    },
    {
      id: 'didit-flow',
      title: 'Didit Verification Flow',
      body: `1. Start verification from your Profile or Wallet page.\n2. Upload a government-issued photo ID (passport, national ID, or driver's license).\n3. Complete a liveness check (selfie/video verification).\n4. Submit for automated and manual review.\n5. Upon approval, your account is upgraded automatically with full financial access.`,
    },
    {
      id: 'data',
      title: 'Verification Data',
      body: `KYC documents are encrypted, stored securely, and retained per regulatory requirements. We do not share verification data except with certified compliance providers and authorities when legally required.`,
    },
  ],
}
