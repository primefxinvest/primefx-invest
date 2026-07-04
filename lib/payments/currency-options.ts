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
  const compact = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const direct = NOW_PAYMENTS_CURRENCIES.find(
    (item) =>
      item.toUpperCase() === code.toUpperCase() ||
      item.replace(/_/g, '').toUpperCase() === compact
  )
  if (direct) return direct

  if (compact === 'USDT' || compact === 'USDTTRC20' || compact === 'TRC20USDT') {
    return 'USDT_TRC20'
  }
  if (compact === 'USDTERC20' || compact === 'ERC20USDT') {
    return 'USDT_ERC20'
  }

  return code.toUpperCase()
}

/** Apply NOWPayments API whitelist; fall back when the filter removes every known coin */
export function filterNowPaymentsCurrencies(
  currencies: readonly string[],
  whitelist?: string[]
): string[] {
  if (!whitelist || whitelist.length === 0) {
    return [...currencies]
  }

  const normalized = [
    ...new Set(whitelist.map((code) => normalizeNowPaymentsCurrencyCode(code))),
  ]
  const intersected = currencies.filter((currency) => normalized.includes(currency))

  return intersected.length > 0 ? intersected : [...currencies]
}

export function buildDepositCurrencyOptions(input?: {
  nowPayments?: boolean
  binancePay?: boolean
  nowPaymentsWhitelist?: string[]
}): CurrencyOption[] {
  const nowEnabled = input?.nowPayments !== false
  const binanceEnabled = input?.binancePay !== false
  const items: CurrencyOption[] = []

  if (binanceEnabled) {
    for (const currency of BINANCE_PAY_CURRENCIES) {
      items.push({
        value: currency,
        label: currency,
        provider: 'binance_pay',
      })
    }
  }

  if (nowEnabled) {
    const allowed = filterNowPaymentsCurrencies(
      NOW_PAYMENTS_CURRENCIES,
      input?.nowPaymentsWhitelist
    )

    for (const currency of allowed) {
      items.push({
        value: currency,
        label: formatCurrencyLabel(currency),
        provider: 'now_payments',
      })
    }
  }

  return items
}

export function isCurrencySupportedByProvider(
  currency: string,
  provider: PaymentProviderId
): boolean {
  const normalized = currency.toUpperCase()

  if (provider === 'binance_pay') {
    return BINANCE_PAY_CURRENCIES.some((item) => item === normalized)
  }

  return NOW_PAYMENTS_CURRENCIES.some(
    (item) => item === normalized || item.replace(/_/g, '') === normalized.replace(/_/g, '')
  )
}

export function buildWithdrawalCurrencyOptions(whitelist?: string[]) {
  const allowed = filterNowPaymentsCurrencies(NOW_PAYMENTS_CURRENCIES, whitelist)

  return allowed.map((currency) => ({
    value: currency,
    label: formatCurrencyLabel(currency),
  }))
}

export function toSelectOptions(options: CurrencyOption[]) {
  return options.map((item) => ({ value: item.value, label: item.label }))
}
