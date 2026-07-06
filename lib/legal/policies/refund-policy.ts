import type { LegalDocument } from '@/lib/legal/types'

export const REFUND_POLICY: LegalDocument = {
  title: 'Refund Policy',
  description: 'Conditions for deposits, withdrawals, and refund eligibility.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'deposits',
      title: 'Deposit Refunds',
      body: `Cryptocurrency deposits are generally non-refundable once confirmed on the blockchain. If a deposit is sent to an incorrect address or wrong network, recovery may not be possible. Contact support immediately if you believe a deposit was made in error.`,
    },
    {
      id: 'withdrawals',
      title: 'Withdrawal Refunds',
      body: `If a withdrawal fails due to platform error, funds will be returned to your wallet balance. Withdrawals sent to incorrect addresses cannot be reversed once processed on the blockchain.`,
    },
    {
      id: 'fees',
      title: 'Fee Refunds',
      body: `Platform fees are non-refundable except in cases of confirmed platform error. Network gas fees paid to blockchain validators are never refundable.`,
    },
    {
      id: 'disputes',
      title: 'Dispute Resolution',
      body: `For refund disputes, contact support@primefxinvest.com within 30 days with transaction details. We will investigate and respond within 14 business days.`,
    },
  ],
}
