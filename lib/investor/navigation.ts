import type { LucideIcon } from 'lucide-react'
import type { InvestorTierKey } from './types'

export interface InvestorNavItem {  href: string
  label: string
  requiredTier?: InvestorTierKey
}

export const INVESTOR_NAV_ITEMS: InvestorNavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/invest', label: 'Invest' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/referral', label: 'Referral & Earn' },
  { href: '/primeai', label: 'PrimeAI' },
  { href: '/academy', label: 'Academy' },
  { href: '/rewards', label: 'Rewards' },
  { href: '/market-insights', label: 'Market Insights', requiredTier: 'growth' },
  { href: '/support', label: 'Support' },
]

export type NavIconMap = Record<string, LucideIcon>
