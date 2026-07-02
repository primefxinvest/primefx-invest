import 'server-only'

import { getDepositCurrencies, getWithdrawalCurrencies } from '@/lib/payments/config'
import { isBinancePayConfigured, isNowPaymentsConfigured } from '@/lib/payments/env'
import { fetchNowPaymentsAvailableCurrencies } from '@/lib/payments/nowpayments'
import type { PaymentProviderOptions } from '@/lib/payments/types'

const NOWPAYMENTS_CURRENCIES_TIMEOUT_MS = 15_000

export type { PaymentProviderOptions }

async function loadNowPaymentsWhitelist(): Promise<string[] | undefined> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      fetchNowPaymentsAvailableCurrencies(),
      new Promise<undefined>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn('[payments] NOWPayments currency list timed out, using defaults.')
          resolve(undefined)
        }, NOWPAYMENTS_CURRENCIES_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    console.warn('[payments] Could not load NOWPayments currencies, using defaults.', err)
    return undefined
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function fetchPaymentProviderOptionsServer(): Promise<PaymentProviderOptions> {
  const nowPaymentsEnabled = isNowPaymentsConfigured()
  const binancePayEnabled = isBinancePayConfigured()

  const nowPaymentsWhitelist = nowPaymentsEnabled ? await loadNowPaymentsWhitelist() : undefined

  const depositCurrencies = getDepositCurrencies({
    nowPayments: true,
    binancePay: true,
    nowPaymentsWhitelist: nowPaymentsEnabled ? nowPaymentsWhitelist : undefined,
  })

  const withdrawalCurrencies = getWithdrawalCurrencies(
    nowPaymentsEnabled ? nowPaymentsWhitelist : undefined
  )

  return {
    depositCurrencies,
    withdrawalCurrencies,
    binancePayEnabled,
    nowPaymentsEnabled,
  }
}
