import type { LegalDocument } from '@/lib/legal/types'

export const RISK_DISCLOSURE: LegalDocument = {
  title: 'Risk Disclosure',
  description: 'Important information about investment and platform risks.',
  lastUpdated: '2026-01-15',
  contactEmail: 'support@primefxinvest.com',
  sections: [
    {
      id: 'general',
      title: 'Investment Risk',
      body: `All investments involve risk, including the potential loss of some or all of your invested capital. Returns displayed on PrimeFx Invest are target rates and not guarantees. You should carefully assess your financial situation before investing.`,
    },
    {
      id: 'market',
      title: 'Market Risk',
      body: `Financial markets are subject to volatility driven by economic conditions, geopolitical events, interest rates, and supply-demand dynamics. PrimeFx Invest primarily operates in gold (XAU/USD) markets, which can experience significant price swings.`,
    },
    {
      id: 'liquidity',
      title: 'Liquidity Risk',
      body: `While PrimeFx Invest supports withdrawals, liquidity may be affected by market conditions, platform processing times, blockchain network congestion, and compliance reviews. Principal withdrawals may require advance notice.`,
    },
    {
      id: 'technology',
      title: 'Technology Risk',
      body: `Digital platforms are subject to technical failures, cyberattacks, and service interruptions. While we implement robust security measures, no system is completely immune to disruption.`,
    },
    {
      id: 'crypto',
      title: 'Cryptocurrency Risk',
      body: `Deposits and withdrawals use cryptocurrency networks subject to price volatility, transaction delays, network fees, and irreversible transactions if incorrect addresses are used. You are responsible for verifying wallet addresses.`,
    },
    {
      id: 'regulatory',
      title: 'Regulatory Risk',
      body: `Financial regulations vary by jurisdiction and may change. Changes in law could affect platform availability, features, or your ability to use services in certain regions.`,
    },
    {
      id: 'disclaimer',
      title: 'Performance Disclaimer',
      body: `Past performance does not guarantee future results. Historical returns, testimonials, and platform statistics are illustrative and should not be relied upon as predictions of future performance.`,
    },
  ],
}
