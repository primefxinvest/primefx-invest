import type { LucideIcon } from 'lucide-react'
import { Bitcoin, Zap } from 'lucide-react'
import type { PaymentProviderId } from './types'

export const PAYMENT_METHOD_LOGOS: Record<PaymentProviderId, string> = {
  binance_pay: '/payments/binance-pay.svg',
  now_payments: '/payments/nowpayments.svg',
}

export const DEPOSIT_METHOD_OPTIONS = [
  {
    "id": "nowpayments" as const,
    provider: 'now_payments' as const,
    logoSrc: PAYMENT_METHOD_LOGOS.now_payments,
    fallbackIcon: Bitcoin as LucideIcon,
    etaKey: 'etaCrypto',
    badgeKey: 'badgeCrypto',
    labelKey: 'methodCryptoPayment',
  },
  {
    id: 'binancepay' as const,
    provider: 'binance_pay' as const,
    logoSrc: PAYMENT_METHOD_LOGOS.binance_pay,
    fallbackIcon: Zap as LucideIcon,
    etaKey: 'etaCrypto',
    badgeKey: 'badgeNoFee',
    labelKey: 'methodBinancePay',
  },
] as const

export type DepositMethodId = (typeof DEPOSIT_METHOD_OPTIONS)[number]['id']
