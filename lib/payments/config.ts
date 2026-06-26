import type { PaymentProviderId } from './types'

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
    cryptoCurrencies: ['BNB', 'BTC', 'ETH', 'USDT', 'BUSD', 'USDC', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC'],
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
    cryptoCurrencies: [
      'BTC',
      'ETH',
      'USDT_TRC20',
      'USDT_ERC20',
      'USDC',
      'BNB',
      'LTC',
      'XRP',
      'SOL',
      'DOGE',
      'ADA',
      'MATIC',
      'TRX',
      'BUSD',
      'DAI',
      'SHIB',
      'AVAX',
      'DOT',
    ],
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

export function getDepositCurrencies(): { value: string; label: string; provider: PaymentProviderId }[] {
  const items = new Map<string, { value: string; label: string; provider: PaymentProviderId }>()

  for (const currency of PAYMENT_PROVIDERS.binance_pay.cryptoCurrencies) {
    items.set(currency, {
      value: currency,
      label: currency,
      provider: 'binance_pay',
    })
  }

  for (const currency of PAYMENT_PROVIDERS.now_payments.cryptoCurrencies) {
    if (!items.has(currency)) {
      items.set(currency, {
        value: currency,
        label: currency.replace('_', ' '),
        provider: 'now_payments',
      })
    }
  }

  return Array.from(items.values())
}

export function getWithdrawalCurrencies() {
  return PAYMENT_PROVIDERS.now_payments.cryptoCurrencies.map((currency) => ({
    value: currency,
    label: currency.replace('_', ' '),
  }))
}
