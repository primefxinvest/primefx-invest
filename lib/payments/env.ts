import type { PaymentProviderId } from './types'

const NOWPAYMENTS_PRODUCTION_BASE = 'https://api.nowpayments.io/v1'
const NOWPAYMENTS_SANDBOX_BASE = 'https://api-sandbox.nowpayments.io/v1'

/** Trim, strip BOM, strip one layer of quotes. */
export function normalizeNowPaymentsCredential(raw: string | undefined): string {
  if (!raw) return ''
  let value = raw.replace(/^\uFEFF/, '').replace(/\r/g, '').trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value
}

export function getPaymentMode(): 'sandbox' | 'production' {
  const mode = normalizeNowPaymentsCredential(process.env.PAYMENT_MODE).toLowerCase()
  return mode === 'production' ? 'production' : 'sandbox'
}

export function getNowPaymentsEnv(): 'sandbox' | 'production' {
  const explicit = normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_ENV).toLowerCase()
  if (explicit === 'sandbox' || explicit === 'production') return explicit
  return getPaymentMode()
}

export function isNowPaymentsSandboxEnv() {
  return getNowPaymentsEnv() === 'sandbox'
}

export function getNowPaymentsBaseUrl() {
  if (getNowPaymentsEnv() === 'sandbox') {
    return (
      normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_SANDBOX_BASE_URL) ||
      NOWPAYMENTS_SANDBOX_BASE
    )
  }

  return (
    normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_BASE_URL) || NOWPAYMENTS_PRODUCTION_BASE
  )
}

export function getWebhookBaseUrl() {
  return (
    process.env.PAYMENT_WEBHOOK_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function getSuccessRedirectUrl() {
  return (
    process.env.PAYMENT_SUCCESS_REDIRECT_URL ??
    `${getWebhookBaseUrl()}/wallet?deposit=success`
  )
}

export function getCancelRedirectUrl() {
  return (
    process.env.PAYMENT_CANCEL_REDIRECT_URL ??
    `${getWebhookBaseUrl()}/wallet?deposit=cancelled`
  )
}

export function getBinancePayMissingEnvVars() {
  const missing: string[] = []

  if (!process.env.BINANCE_PAY_API_KEY?.trim()) missing.push('BINANCE_PAY_API_KEY')
  if (!process.env.BINANCE_PAY_API_SECRET?.trim()) missing.push('BINANCE_PAY_API_SECRET')

  return missing
}

export function isBinancePayConfigured() {
  return getBinancePayMissingEnvVars().length === 0
}

export function getBinancePayConfigError() {
  const missing = getBinancePayMissingEnvVars()
  if (missing.length === 0) return null

  return `Binance Pay is missing in .env: ${missing.join(', ')}. Add them and restart the dev server.`
}

export function isNowPaymentsConfigured() {
  return Boolean(
    normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_API_KEY) &&
      normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_IPN_SECRET)
  )
}

export function isProviderConfigured(provider: PaymentProviderId) {
  if (provider === 'binance_pay') return isBinancePayConfigured()
  return isNowPaymentsConfigured()
}

export function getBinancePayBaseUrl() {
  return process.env.BINANCE_PAY_BASE_URL ?? 'https://bpay.binanceapi.com'
}
