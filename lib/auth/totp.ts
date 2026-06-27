import * as OTPAuth from 'otpauth'

const ISSUER = 'PrimeFx Invest'

export function buildTotpUri(email: string, secret: string) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  return totp.toString()
}

export function createTotpSetup(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 })

  return {
    secret: secret.base32,
    uri: buildTotpUri(email, secret.base32),
  }
}

export function verifyTotpCode(secret: string, code: string) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  const delta = totp.validate({ token: code.replace(/\s/g, ''), window: 2 })
  return delta !== null
}

export function getQrCodeUrl(uri: string, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(uri)}`
}

export type QrCodeRender =
  | { kind: 'image'; src: string }
  | { kind: 'svg'; markup: string }

export function getQrCodeRenderOptions(options: {
  qrCode?: string
  uri?: string
}): QrCodeRender | null {
  const { qrCode, uri } = options

  if (qrCode) {
    const trimmed = qrCode.trim()
    if (trimmed.startsWith('data:') || /^https?:\/\//i.test(trimmed)) {
      return { kind: 'image', src: trimmed }
    }
    if (trimmed.startsWith('<')) {
      return { kind: 'svg', markup: trimmed }
    }
  }

  if (uri) {
    return { kind: 'image', src: getQrCodeUrl(uri) }
  }

  return null
}
