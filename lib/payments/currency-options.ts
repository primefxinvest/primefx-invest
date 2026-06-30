import type { PaymentProviderId } from './types'

/** Supported NOWPayments payout / deposit preference codes */
export const NOW_PAYMENTS_CURRENCIES = [
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
] as const

/** Binance Pay deposit currencies */
export const BINANCE_PAY_CURRENCIES = [
  'BNB',
  'BTC',
  'ETH',
  'USDT',
  'BUSD',
  'USDC',
  'XRP',
  'ADA',
  'DOGE',
  'SOL',
  'DOT',
  'MATIC',
] as const

export type CurrencyOption = {
  value: string
  label: string
  provider: PaymentProviderId
}

export const DEFAULT_DEPOSIT_CURRENCY = 'USDT_TRC20'
export const DEFAULT_WITHDRAW_CURRENCY = 'USDT_TRC20'

export function formatCurrencyLabel(currency: string) {
  return currency.replace(/_/g, ' ')
}

/** Map NOWPayments API currency codes (e.g. usdttrc20) back to our option values */
export function normalizeNowPaymentsCurrencyCode(code: string): string {
  const upper = code.toUpperCase()
  const direct = NOW_PAYMENTS_CURRENCIES.find(
    (item) => item.toUpperCase() === upper || item.replace(/_/g, '').toUpperCase() === upper
  )
  if (direct) return direct

  if (upper === 'USDT') return 'USDT_TRC20'
  if (upper === 'USDTTRC20') return 'USDT_TRC20'
  if (upper === 'USDTERC20') return 'USDT_ERC20'

  return upper
}

export function buildDepositCurrencyOptions(input?: {
  nowPayments?: boolean
  binancePay?: boolean
  nowPaymentsWhitelist?: string[]
}): CurrencyOption[] {
  const nowEnabled = input?.nowPayments !== false
  const binanceEnabled = input?.binancePay !== false
  const whitelist = input?.nowPaymentsWhitelist?.map((code) => normalizeNowPaymentsCurrencyCode(code))
  const items = new Map<string, CurrencyOption>()

  if (binanceEnabled) {
    for (const currency of BINANCE_PAY_CURRENCIES) {
      items.set(currency, {
        value: currency,
        label: currency,
        provider: 'binance_pay',
      })
    }
  }

  if (nowEnabled) {
    for (const currency of NOW_PAYMENTS_CURRENCIES) {
      if (whitelist && whitelist.length > 0 && !whitelist.includes(currency)) {
        continue
      }
      if (!items.has(currency)) {
        items.set(currency, {
          value: currency,
          label: formatCurrencyLabel(currency),
          provider: 'now_payments',
        })
      }
    }
  }

  return Array.from(items.values())
}

export function buildWithdrawalCurrencyOptions(whitelist?: string[]) {
  const allowed =
    whitelist && whitelist.length > 0
      ? whitelist.map((code) => normalizeNowPaymentsCurrencyCode(code))
      : [...NOW_PAYMENTS_CURRENCIES]

  return allowed.map((currency) => ({
    value: currency,
    label: formatCurrencyLabel(currency),
  }))
}

export function toSelectOptions(options: CurrencyOption[]) {
  return options.map((item) => ({ value: item.value, label: item.label }))
}
