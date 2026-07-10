import { createHmac, timingSafeEqual } from 'crypto'
import {
  getCancelRedirectUrl,
  getNowPaymentsBaseUrl,
  getNowPaymentsEnv,
  getSuccessRedirectUrl,
  buildPaymentWebhookUrl,
  isNowPaymentsSandboxEnv,
  normalizeNowPaymentsCredential,
} from './env'

function getNowPaymentsApiKey(): string {
  const key = normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_API_KEY)
  if (!key) {
    throw new Error('NOWPAYMENTS_API_KEY is not set.')
  }
  return key
}

function getNowPaymentsIpnSecret(): string {
  const secret = normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_IPN_SECRET)
  if (!secret) {
    throw new Error('NOWPAYMENTS_IPN_SECRET is not set.')
  }
  return secret
}

async function nowPaymentsRequest<T>(
  path: string,
  options: { method?: string; body?: Record<string, unknown>; jwt?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': getNowPaymentsApiKey(),
  }

  if (options.jwt) {
    headers.Authorization = `Bearer ${options.jwt}`
  }

  const response = await fetch(`${getNowPaymentsBaseUrl()}${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const json = (await response.json()) as T & { message?: string; code?: string }

  if (!response.ok) {
    throw new Error(json.message ?? `NOWPayments request failed (${response.status})`)
  }

  return json
}

export async function getNowPaymentsJwt() {
  const cached = normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_JWT_TOKEN)
  if (cached) return cached

  const email = normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_EMAIL)
  const password = normalizeNowPaymentsCredential(process.env.NOWPAYMENTS_PASSWORD)
  if (!email || !password) {
    throw new Error('NOWPayments JWT credentials are not configured.')
  }

  const result = await nowPaymentsRequest<{ token: string }>('/auth', {
    method: 'POST',
    body: { email, password },
  })

  return result.token
}

export interface NowPaymentsInvoiceParams {
  orderId: string
  amount: number
  currency: string
  payCurrency?: string
  description: string
  buyerEmail?: string
  successUrl?: string
  cancelUrl?: string
  callbackUrl?: string
}

export function toNowPaymentsPayCurrency(currency: string): string {
  return currency.toLowerCase().replace(/_/g, '')
}

const NOWPAYMENTS_FETCH_TIMEOUT_MS = 15_000

export async function fetchNowPaymentsAvailableCurrencies(): Promise<string[]> {
  const response = await fetch(`${getNowPaymentsBaseUrl()}/currencies`, {
    headers: {
      'x-api-key': getNowPaymentsApiKey(),
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(NOWPAYMENTS_FETCH_TIMEOUT_MS),
  })

  const data = (await response.json()) as { currencies?: string[]; message?: string }

  if (!response.ok) {
    throw new Error(data.message ?? `NOWPayments currencies request failed (${response.status})`)
  }

  if (!Array.isArray(data.currencies) || data.currencies.length === 0) {
    throw new Error('NOWPayments returned no currencies')
  }

  return data.currencies
}

export async function createNowPaymentsInvoice(params: NowPaymentsInvoiceParams) {
  const apiKey = getNowPaymentsApiKey()
  const baseUrl = getNowPaymentsBaseUrl()

  const ipnCallbackUrl =
    params.callbackUrl ?? buildPaymentWebhookUrl('/api/webhooks/nowpayments')

  const body = {
    price_amount: params.amount,
    price_currency: params.currency.toLowerCase(),
    order_id: params.orderId,
    order_description: params.description,
    ipn_callback_url: ipnCallbackUrl,
    success_url: params.successUrl ?? getSuccessRedirectUrl(params.orderId),
    cancel_url: params.cancelUrl ?? getCancelRedirectUrl(params.orderId),
    is_fixed_rate: false,
    is_fee_paid_by_user: false,
    ...(params.buyerEmail ? { customer_email: params.buyerEmail } : {}),
    ...(params.payCurrency ? { pay_currency: params.payCurrency.toLowerCase() } : {}),
  }

  const response = await fetch(`${baseUrl}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(NOWPAYMENTS_FETCH_TIMEOUT_MS),
  })

  const data = (await response.json()) as Record<string, unknown> & {
    invoice_url?: string
    id?: string | number
    payment_id?: number
    code?: string
    message?: string
    statusCode?: number
  }

  if (!data.invoice_url) {
    if (data.code === 'INVALID_API_KEY') {
      const resolvedEnv = getNowPaymentsEnv()
      const envHint = isNowPaymentsSandboxEnv()
        ? 'Calling SANDBOX API — use a sandbox API key or set NOWPAYMENTS_ENV=production for a live key.'
        : 'Calling PRODUCTION API — use a live API key or set NOWPAYMENTS_ENV=sandbox for a sandbox key.'
      throw new Error(
        `NOWPayments invalid API key (${String(data.message ?? 'INVALID_API_KEY')}). ` +
          `Host: ${baseUrl} (env=${resolvedEnv}). ${envHint}`
      )
    }
    throw new Error(`NOWPayments invoice failed: ${JSON.stringify(data)}`)
  }

  return {
    invoiceUrl: data.invoice_url,
    invoiceId: String(data.id ?? ''),
    paymentId: typeof data.payment_id === 'number' ? data.payment_id : undefined,
  }
}

export async function createNowPaymentsPayout(input: {
  address: string
  currency: string
  amount: number
  extraId: string
}) {
  const jwt = await getNowPaymentsJwt()
  const payoutCallbackUrl = buildPaymentWebhookUrl('/api/webhooks/nowpayments-payout')

  return nowPaymentsRequest<{ id: string | number }>('/payout', {
    jwt,
    body: {
      ipn_callback_url: payoutCallbackUrl,
      withdrawals: [
        {
          address: input.address,
          currency: toNowPaymentsPayCurrency(input.currency),
          amount: input.amount,
          ipn_callback_url: payoutCallbackUrl,
          extra_id: input.extraId,
        },
      ],
    },
  })
}

export function verifyNowPaymentsSignature(rawBody: string, receivedSignature: string): boolean {
  try {
    const secret = getNowPaymentsIpnSecret()
    if (!receivedSignature) return false

    const parsed = JSON.parse(rawBody) as Record<string, unknown>
    const sortedString = JSON.stringify(
      Object.keys(parsed)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = parsed[key]
          return acc
        }, {})
    )

    const expected = createHmac('sha512', secret).update(sortedString).digest('hex')

    if (expected.length !== receivedSignature.length) return false

    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(receivedSignature, 'hex'))
  } catch {
    return false
  }
}


export function isPaymentComplete(status: string): boolean {
  return status === 'finished'
}

export function isPaymentFailed(status: string): boolean {
  return ['failed', 'refunded', 'expired'].includes(status)
}

export type NowPaymentsPaymentRecord = {
  payment_id?: number | string
  payment_status?: string
  pay_amount?: number | string
  order_id?: string
  [key: string]: unknown
}

export async function getNowPaymentsPaymentStatus(paymentId: string | number) {
  const apiKey = getNowPaymentsApiKey()
  const baseUrl = getNowPaymentsBaseUrl()

  const response = await fetch(`${baseUrl}/payment/${paymentId}`, {
    headers: { 'x-api-key': apiKey },
    signal: AbortSignal.timeout(NOWPAYMENTS_FETCH_TIMEOUT_MS),
  })

  const data = (await response.json()) as NowPaymentsPaymentRecord & { message?: string }

  if (!response.ok) {
    throw new Error(data.message ?? `NOWPayments payment status failed (${response.status})`)
  }

  return data
}

export async function listNowPaymentsPaymentsByOrderId(orderId: string) {
  const apiKey = getNowPaymentsApiKey()
  const baseUrl = getNowPaymentsBaseUrl()
  const url = `${baseUrl}/payment?order_id=${encodeURIComponent(orderId)}&limit=10&sortBy=created_at&orderBy=desc`

  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey },
    signal: AbortSignal.timeout(NOWPAYMENTS_FETCH_TIMEOUT_MS),
  })

  const json = (await response.json()) as
    | NowPaymentsPaymentRecord[]
    | { data?: NowPaymentsPaymentRecord[]; payments?: NowPaymentsPaymentRecord[]; message?: string }

  if (!response.ok) {
    const message =
      !Array.isArray(json) && typeof json.message === 'string'
        ? json.message
        : `NOWPayments payment list failed (${response.status})`
    throw new Error(message)
  }

  if (Array.isArray(json)) return json
  if (Array.isArray(json.data)) return json.data
  if (Array.isArray(json.payments)) return json.payments
  return []
}
