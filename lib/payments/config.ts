import type { PaymentProviderId } from './types'
import {
  BINANCE_PAY_CURRENCIES,
  buildDepositCurrencyOptions,
  buildWithdrawalCurrencyOptions,
  NOW_PAYMENTS_CURRENCIES,
} from './currency-options'

export const PAYMENT_PROVIDERS = {
  binance_pay: {
    id: 'binance_pay' as const,
    name: 'Binance Pay',
    logo: 'https://public.bnbstatic.com/image/cms/blog/20210715/binance-pay.png',
    depositMinUsd: 10,
    depositMaxUsd: 500_000,
    depositFeePercent: 0,
    supportsWithdrawal: false,
    fiatCurrencies: ['USD', 'EUR', 'GBP', 'AED', 'SGD'],
    cryptoCurrencies: [...BINANCE_PAY_CURRENCIES],
  },
  now_payments: {
    id: 'now_payments' as const,
    name: 'NOWPayments',
    logo: 'https://nowpayments.io/images/logo.svg',
    depositMinUsd: 10,
    depositMaxUsd: 500_000,
    withdrawalMinUsd: 20,
    withdrawalMaxUsd: 100_000,
    depositFeePercent: 0.5,
    withdrawalFeePercent: 0.5,
    supportsWithdrawal: true,
    cryptoCurrencies: [...NOW_PAYMENTS_CURRENCIES],
  },
} as const

/** Deposit routing from unified payment config */
const DEPOSIT_ROUTING: Record<string, PaymentProviderId> = {
  BNB: 'binance_pay',
  BUSD: 'binance_pay',
  BTC: 'now_payments',
  ETH: 'now_payments',
  USDT_TRC20: 'now_payments',
  USDT_ERC20: 'now_payments',
  USDT: 'now_payments',
  USDC: 'now_payments',
  XRP: 'now_payments',
  SOL: 'now_payments',
}

export function resolveDepositProvider(currency: string): PaymentProviderId {
  const normalized = currency.toUpperCase()
  return DEPOSIT_ROUTING[normalized] ?? 'now_payments'
}

export function getDepositCurrencies(input?: {
  nowPayments?: boolean
  binancePay?: boolean
  nowPaymentsWhitelist?: string[]
}): { value: string; label: string; provider: PaymentProviderId }[] {
  return buildDepositCurrencyOptions(input)
}

export function getWithdrawalCurrencies(nowPaymentsWhitelist?: string[]) {
  return buildWithdrawalCurrencyOptions(nowPaymentsWhitelist)
}
