import { createHmac, createVerify, randomBytes } from 'crypto'
import { getBinancePayBaseUrl, getCancelRedirectUrl, getSuccessRedirectUrl } from './env'

const REQUEST_TIMEOUT_MS = 10_000

function getCredentials() {
  const apiKey = process.env.BINANCE_PAY_API_KEY?.trim()
  const apiSecret = process.env.BINANCE_PAY_API_SECRET?.trim()

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Binance Pay is not configured (missing BINANCE_PAY_API_KEY or BINANCE_PAY_API_SECRET).'
    )
  }

  return { apiKey, apiSecret }
}

function buildSignature(timestamp: string, nonce: string, body: string, apiSecret: string) {
  const payload = `${timestamp}\n${nonce}\n${body}\n`
  return createHmac('sha512', apiSecret).update(payload).digest('hex').toUpperCase()
}

function buildHeaders(body: string) {
  const { apiKey, apiSecret } = getCredentials()
  const timestamp = Date.now().toString()
  const nonce = randomBytes(16).toString('hex').toUpperCase()
  const signature = buildSignature(timestamp, nonce, body, apiSecret)

  return {
    'Content-Type': 'application/json',
    'BinancePay-Timestamp': timestamp,
    'BinancePay-Nonce': nonce,
    'BinancePay-Certificate-SN': apiKey,
    'BinancePay-Signature': signature,
  }
}

function extractFetchError(err: unknown) {
  if (!(err instanceof Error)) return String(err)

  const cause = (err as Error & { cause?: unknown }).cause
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: string }).code
    return code ? `${cause.message} (${code})` : cause.message
  }

  return err.message
}

async function binancePayRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const bodyStr = JSON.stringify(body)
  const headers = buildHeaders(bodyStr)
  const url = `${getBinancePayBaseUrl()}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    const reason = extractFetchError(err)
    throw new Error(
      `Could not reach Binance Pay (${url}): ${reason}. ` +
        'If this is a connection timeout, your server may be blocked by geo-restrictions or a firewall.'
    )
  }

  const rawBody = await response.text()

  let json: { status?: string; code?: string; errorMessage?: string; data?: T }
  try {
    json = JSON.parse(rawBody) as typeof json
  } catch {
    throw new Error(
      `Binance Pay returned non-JSON response (HTTP ${response.status}): ${rawBody.slice(0, 200)}`
    )
  }

  if (!response.ok || json.status !== 'SUCCESS') {
    throw new Error(
      `Binance Pay error (HTTP ${response.status}): ${json.code ?? 'no-code'} – ${json.errorMessage ?? json.status ?? rawBody.slice(0, 200)}`
    )
  }

  return json.data as T
}

export interface CreateOrderParams {
  merchantOrderId: string
  orderAmount: number
  currency: string
  description: string
  returnUrl?: string
  cancelUrl?: string
}

export interface BinancePayOrder {
  prepayId: string
  terminalType: string
  expireTime: number
  qrcodeLink: string
  qrContent: string
  checkoutUrl: string
  deeplink: string
  universalUrl: string
}

export async function createBinancePayOrder(params: CreateOrderParams): Promise<BinancePayOrder> {
  const merchantTradeNo = params.merchantOrderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 32)

  if (!merchantTradeNo) {
    throw new Error(
      `merchantTradeNo became empty after sanitization. Original: "${params.merchantOrderId}"`
    )
  }

  const goodsName = params.description.slice(0, 256)

  return binancePayRequest<BinancePayOrder>('/binancepay/openapi/v3/order', {
    env: {
      terminalType: 'WEB',
    },
    merchantTradeNo,
    orderAmount: Number(params.orderAmount.toFixed(2)),
    currency: params.currency.toUpperCase(),
    description: goodsName,
    returnUrl: params.returnUrl ?? getSuccessRedirectUrl(),
    cancelUrl: params.cancelUrl ?? getCancelRedirectUrl(),
    goodsDetails: [
      {
        goodsType: '01',
        goodsCategory: 'Z000',
        referenceGoodsId: merchantTradeNo,
        goodsName,
      },
    ],
  })
}

export async function queryBinanceOrder(prepayId: string) {
  return binancePayRequest<{ status: string; transactionId: string }>(
    '/binancepay/openapi/v3/order/query',
    { prepayId }
  )
}

interface CachedCert {
  pem: string
  expiresAt: number
}

const certCache = new Map<string, CachedCert>()
const CERT_TTL_MS = 6 * 60 * 60 * 1000

async function getBinancePublicCert(certSerial: string): Promise<string> {
  const cached = certCache.get(certSerial)
  if (cached && cached.expiresAt > Date.now()) return cached.pem

  const data = await binancePayRequest<Array<{ certSerial: string; certPublic: string }>>(
    '/binancepay/openapi/certificates',
    {}
  )

  const match = data.find((cert) => cert.certSerial === certSerial)
  if (!match) {
    throw new Error(
      `Binance certificate ${certSerial} not found. Available: ${data.map((cert) => cert.certSerial).join(', ')}`
    )
  }

  certCache.set(certSerial, {
    pem: match.certPublic,
    expiresAt: Date.now() + CERT_TTL_MS,
  })

  return match.certPublic
}

export async function verifyBinancePayWebhook(
  timestamp: string,
  nonce: string,
  body: string,
  receivedSignature: string,
  certificateSerial: string
): Promise<boolean> {
  if (!timestamp || !nonce || !body || !receivedSignature || !certificateSerial) {
    return false
  }

  const toleranceMs = Number(process.env.BINANCE_PAY_TIMESTAMP_TOLERANCE_SECONDS ?? 300) * 1000
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > toleranceMs) {
    return false
  }

  try {
    const publicKeyPem = await getBinancePublicCert(certificateSerial)
    const payload = `${timestamp}\n${nonce}\n${body}\n`

    const verifier = createVerify('RSA-SHA256')
    verifier.update(payload, 'utf8')
    verifier.end()

    return verifier.verify(publicKeyPem, receivedSignature, 'base64')
  } catch {
    return false
  }
}

// Backward-compatible alias used by webhook route
export const verifyBinanceWebhook = verifyBinancePayWebhook
