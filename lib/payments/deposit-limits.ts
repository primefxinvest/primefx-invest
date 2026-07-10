import 'server-only'

import { formatCurrencyLabel } from './currency-options'
import { fetchNowPaymentsMinimumAmount, toNowPaymentsPayCurrency } from './nowpayments'
import { INVESTOR_RULES } from '@/lib/investor/rules'

/** UI-only network fee estimates for deposit currency display. */
const DEPOSIT_NETWORK_FEE_USD: Record<string, number> = {
  BTC: 2.5,
  ETH: 4.0,
  USDT_TRC20: 1.0,
  USDT_ERC20: 5.0,
  USDC: 4.5,
  BNB: 0.35,
  LTC: 0.5,
  XRP: 0.2,
  SOL: 0.25,
  DOGE: 0.3,
  ADA: 0.4,
  MATIC: 0.15,
  TRX: 0.15,
  BUSD: 0.8,
  DAI: 4.0,
  SHIB: 1.0,
  AVAX: 0.5,
  DOT: 0.4,
}

export function getDepositNetworkFeeEstimateUsd(currency: string): number {
  const normalized = currency.toUpperCase()
  return DEPOSIT_NETWORK_FEE_USD[normalized] ?? 1.0
}

export function resolveEffectiveDepositMinimumUsd(platformMinUsd: number, nowPaymentsMinUsd: number) {
  return Math.max(platformMinUsd, nowPaymentsMinUsd)
}

export function formatDepositMinimumError(currency: string, minimumUsd: number): string {
  const label = formatCurrencyLabel(currency)
  const formatted = minimumUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `The minimum deposit for ${label} is ${formatted}`
}

export type DepositCurrencyLimits = {
  currency: string
  payCurrency: string
  currencyLabel: string
  platformMinUsd: number
  nowPaymentsMinUsd: number
  effectiveMinUsd: number
  networkFeeUsd: number
}

export async function getDepositCurrencyLimits(currency: string): Promise<DepositCurrencyLimits> {
  const normalized = currency.toUpperCase()
  const payCurrency = toNowPaymentsPayCurrency(normalized)
  const platformMinUsd: number = INVESTOR_RULES.financial.minimumDeposit

  let nowPaymentsMinUsd: number = platformMinUsd

  try {
    const minimum = await fetchNowPaymentsMinimumAmount({ payCurrency })
    if (Number.isFinite(minimum.fiatMinUsd) && minimum.fiatMinUsd > 0) {
      nowPaymentsMinUsd = minimum.fiatMinUsd
    }
  } catch (err) {
    console.warn('[payments] NOWPayments min-amount lookup failed:', err)
  }

  const effectiveMinUsd = resolveEffectiveDepositMinimumUsd(platformMinUsd, nowPaymentsMinUsd)

  return {
    currency: normalized,
    payCurrency,
    currencyLabel: formatCurrencyLabel(normalized),
    platformMinUsd,
    nowPaymentsMinUsd,
    effectiveMinUsd,
    networkFeeUsd: getDepositNetworkFeeEstimateUsd(normalized),
  }
}

export async function assertDepositMeetsNowPaymentsMinimum(
  currency: string,
  amountUsd: number
): Promise<{ ok: true; limits: DepositCurrencyLimits } | { ok: false; error: string; limits: DepositCurrencyLimits }> {
  const limits = await getDepositCurrencyLimits(currency)

  if (amountUsd < limits.effectiveMinUsd) {
    return {
      ok: false,
      error: formatDepositMinimumError(currency, limits.effectiveMinUsd),
      limits,
    }
  }

  return { ok: true, limits }
}
