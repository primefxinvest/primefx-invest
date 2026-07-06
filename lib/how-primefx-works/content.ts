import {
  ArrowLeftRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Coins,
  Fingerprint,
  Gift,
  Globe,
  Headphones,
  Layers,
  LineChart,
  Lock,
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { INTERNAL_TRANSFER_FEE_USD } from '@/lib/fees/constants'
import { formatDisplayFeeUsd } from '@/lib/fees/display'
import { PLAN_UI_META } from '@/lib/invest/plan-mapper'
import { REFERRAL_PROFIT_SHARE_LEVELS } from '@/lib/referral/program-config'

export const TRUST_BADGES = [
  'Global Access',
  'Secure Platform',
  'Identity Verification',
  'Weekly Profit Distribution',
  '24/7 Support',
  'PrimeAI Assistance',
] as const

export interface JourneyStep {
  number: number
  title: string
  description: string
  icon: LucideIcon
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    number: 1,
    title: 'Create Account',
    description: 'Sign up in minutes with your email. Set up your secure investor profile.',
    icon: UserPlus,
  },
  {
    number: 2,
    title: 'Verify Identity',
    description: 'Complete KYC verification to unlock deposits, withdrawals, and transfers.',
    icon: ShieldCheck,
  },
  {
    number: 3,
    title: 'Deposit Crypto',
    description: 'Add funds using USDT, BTC, or ETH. Balances update after blockchain confirmation.',
    icon: Wallet,
  },
  {
    number: 4,
    title: 'Select Investment Plan',
    description: 'Compare Starter, Growth, Prime, and Elite plans. Choose what fits your goals.',
    icon: Layers,
  },
  {
    number: 5,
    title: 'Activate Investment',
    description: 'Confirm your allocation. Your investment begins generating weekly returns.',
    icon: Rocket,
  },
  {
    number: 6,
    title: 'Receive Weekly Profit',
    description: 'Profits are distributed every week directly to your wallet balance.',
    icon: Coins,
  },
  {
    number: 7,
    title: 'Withdraw Anytime',
    description: 'Withdraw profits or principal on your schedule, subject to platform terms.',
    icon: ArrowLeftRight,
  },
  {
    number: 8,
    title: 'Reinvest or Diversify',
    description: 'Compound returns by reinvesting or open additional plans to diversify.',
    icon: RefreshCw,
  },
]

export interface PlanDisplay {
  name: string
  minimum: string
  weeklyReturn: string
  payout: string
  bestFor: string
  theme: 'starter' | 'growth' | 'prime' | 'elite'
}

export const INVESTMENT_PLANS: PlanDisplay[] = [
  {
    name: 'Starter Plan',
    minimum: '$150',
    weeklyReturn: PLAN_UI_META['Starter Plan'].displayWeeklyRoi,
    payout: 'Weekly Payout',
    bestFor: 'Beginners exploring structured investing',
    theme: 'starter',
  },
  {
    name: 'Growth Plan',
    minimum: '$500',
    weeklyReturn: PLAN_UI_META['Growth Plan'].displayWeeklyRoi,
    payout: 'Weekly Payout',
    bestFor: 'Growing portfolios with balanced returns',
    theme: 'growth',
  },
  {
    name: 'Prime Plan',
    minimum: '$2,000',
    weeklyReturn: PLAN_UI_META['Prime Plan'].displayWeeklyRoi,
    payout: 'Weekly Payout',
    bestFor: 'Serious investors seeking higher allocation',
    theme: 'prime',
  },
  {
    name: 'Elite Plan',
    minimum: '$10,000',
    weeklyReturn: PLAN_UI_META['Elite Plan'].displayWeeklyRoi,
    payout: 'Weekly Payout',
    bestFor: 'Premium investors with larger capital',
    theme: 'elite',
  },
]

export const PLAN_THEME_STYLES: Record<
  PlanDisplay['theme'],
  { header: string; accent: string; ring: string }
> = {
  starter: {
    header: 'bg-emerald-500',
    accent: 'text-emerald-600',
    ring: 'ring-emerald-100',
  },
  growth: {
    header: 'bg-[#0052ff]',
    accent: 'text-[#0052ff]',
    ring: 'ring-blue-100',
  },
  prime: {
    header: 'bg-purple-600',
    accent: 'text-purple-600',
    ring: 'ring-purple-100',
  },
  elite: {
    header: 'bg-orange-500',
    accent: 'text-orange-600',
    ring: 'ring-orange-100',
  },
}

export const REFERRAL_FLOW = [
  { step: 1, title: 'Share referral link', description: 'Copy your unique link from the Referral page.' },
  { step: 2, title: 'Friend creates account', description: 'They register using your referral link.' },
  { step: 3, title: 'Friend deposits', description: 'They add funds to their wallet via crypto.' },
  { step: 4, title: 'Friend invests', description: 'They activate an investment plan on the platform.' },
  { step: 5, title: 'Commission generated', description: 'Eligible commissions are calculated per program terms.' },
  { step: 6, title: 'Earnings in wallet', description: 'Referral earnings appear in your wallet balance.' },
  { step: 7, title: 'Withdraw anytime', description: 'Withdraw referral earnings like any other balance.' },
] as const

export const REFERRAL_LEVELS = REFERRAL_PROFIT_SHARE_LEVELS.map((row) => ({
  level: row.level,
  label: row.label,
  rate: `${row.rate * 100}%`,
  description: row.description,
}))

export const DEPOSIT_ASSETS = [
  { symbol: 'USDT', networks: ['TRC20', 'ERC20', 'BEP20'] },
  { symbol: 'BTC', networks: ['Bitcoin'] },
  { symbol: 'ETH', networks: ['Ethereum'] },
] as const

export const WITHDRAWAL_NETWORKS = ['TRC20', 'ERC20', 'BEP20', 'SOL'] as const

export const FEE_ROWS = [
  { label: 'Wallet Fee', value: '$1.50', note: 'One-time account wallet setup' },
  {
    label: 'Internal Transfer',
    value: formatDisplayFeeUsd(INTERNAL_TRANSFER_FEE_USD),
    note: 'Fixed fee per transfer to other PrimeFx users',
  },
  { label: 'Hidden Fees', value: 'None', note: 'Transparent pricing always' },
  { label: 'Management Fees', value: 'None', note: 'No ongoing management charges' },
  { label: 'Trading Fees', value: 'None', note: 'No per-trade commissions' },
] as const

export const KYC_STEPS = [
  { step: 1, title: 'Start verification', description: 'Open verification from your profile or wallet.' },
  { step: 2, title: 'Upload ID', description: 'Submit a government-issued identity document.' },
  { step: 3, title: 'Complete liveness check', description: 'Confirm your identity with a quick selfie scan.' },
  { step: 4, title: 'Verification reviewed', description: 'Our compliance team reviews your submission.' },
  { step: 5, title: 'Account upgraded', description: 'Approved accounts unlock full financial features automatically.' },
] as const

export const PRIMEAI_CAPABILITIES = [
  { icon: LineChart, title: 'Analyze portfolio', description: 'Review allocation, performance, and exposure.' },
  { icon: Layers, title: 'Compare plans', description: 'Understand differences between investment tiers.' },
  { icon: Shield, title: 'Understand risks', description: 'Get plain-language explanations of key risks.' },
  { icon: Sparkles, title: 'Explore opportunities', description: 'Discover strategies aligned with your profile.' },
  { icon: Bot, title: 'Build strategies', description: 'Plan reinvestment and diversification approaches.' },
] as const

export const SECURITY_FEATURES = [
  { icon: Lock, title: 'Encryption', description: 'Data protected with industry-standard encryption.' },
  { icon: ShieldCheck, title: 'Secure infrastructure', description: 'Hosted on hardened, monitored cloud systems.' },
  { icon: Fingerprint, title: 'MFA support', description: 'Two-factor authentication for account protection.' },
  { icon: BadgeCheck, title: 'Session protection', description: 'Automatic session policies and secure sign-out.' },
  { icon: Shield, title: 'Identity verification', description: 'KYC required for financial operations.' },
  { icon: Globe, title: 'Fraud monitoring', description: 'Continuous monitoring for suspicious activity.' },
] as const

export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is PrimeFx safe?',
    answer:
      'PrimeFx Invest uses encryption, identity verification, multi-factor authentication, and continuous fraud monitoring. We follow institutional security practices and transparent operational policies. As with any investment platform, you should only invest what you can afford and review all terms before committing capital.',
  },
  {
    question: 'How do profits work?',
    answer:
      'Each investment plan has a target weekly return rate. Profits are calculated on your active principal and distributed weekly to your wallet. You may withdraw profits or reinvest them. Principal remains invested until you initiate a withdrawal according to plan terms.',
  },
  {
    question: 'Can I have multiple investments?',
    answer:
      'Yes. You can hold multiple active investments across different plans simultaneously. Each investment operates independently with its own principal, weekly return, and portfolio analytics. Plans are never merged automatically.',
  },
  {
    question: 'How do withdrawals work?',
    answer:
      'You can withdraw profits or principal to supported crypto networks. Submit a withdrawal request from your wallet, select your network and address, and confirm. Processing time depends on platform review and blockchain confirmations.',
  },
  {
    question: 'How does referral work?',
    answer:
      'Share your referral link with others. When referred members deposit and invest, you may earn commissions according to the referral program levels. Earnings are credited to your wallet and can be withdrawn like other balances. Commission rates and eligibility are defined in the referral program terms.',
  },
  {
    question: 'What happens after KYC?',
    answer:
      'Once identity verification is approved, your account is upgraded automatically. You gain access to deposits, withdrawals, internal transfers, and full wallet features. Until verification is complete, financial operations remain restricted.',
  },
  {
    question: 'How long do withdrawals take?',
    answer:
      'Withdrawals are typically processed within 24 hours after approval, though blockchain confirmation times vary by network. High-traffic periods or additional security reviews may extend processing in rare cases.',
  },
  {
    question: 'What cryptocurrencies are supported?',
    answer:
      'Deposits support USDT (TRC20, ERC20, BEP20), BTC, and ETH. Withdrawals support TRC20, ERC20, BEP20, and SOL networks. Supported assets may be updated over time — check your wallet for the latest options.',
  },
  {
    question: 'What is the internal transfer fee?',
    answer:
      'Internal transfers between PrimeFx Invest accounts are processed instantly with a fixed fee of $1.20.',
  },
]

export const PLATFORM_METRICS = [
  { icon: UserPlus, value: '120K+', label: 'Active Investors' },
  { icon: Wallet, value: '$48M+', label: 'Total Invested' },
  { icon: Gift, value: '$7.2M+', label: 'Total Paid' },
  { icon: Headphones, value: '99.98%', label: 'Platform Uptime' },
] as const

export const NO_FEE_ITEMS = [
  'No deposit fees',
  'No trading fees',
  'No management fees',
  'No hidden charges',
] as const
