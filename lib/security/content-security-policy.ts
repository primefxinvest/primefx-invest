import { NextResponse } from 'next/server'

/**
 * Content Security Policy builder for PrimeFx production.
 * Applied via middleware with per-request nonce for script execution control.
 */

function originFromEnvUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    return new URL(raw.trim()).origin
  } catch {
    return null
  }
}

function supabaseOrigins(): string[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const origin = originFromEnvUrl(url)
  if (!origin) return []

  try {
    const host = new URL(origin).host
    return [origin, `wss://${host}`, `https://${host}`]
  } catch {
    return [origin]
  }
}

export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

export function buildContentSecurityPolicy(nonce: string): string {
  const connectSrc = new Set<string>(["'self'"])
  const frameSrc = new Set<string>(["'self'"])
  const scriptSrc = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`]
  const formAction = new Set<string>(["'self'"])

  for (const origin of supabaseOrigins()) {
    connectSrc.add(origin)
  }

  connectSrc.add('https://generativelanguage.googleapis.com')
  connectSrc.add('https://api.openai.com')
  connectSrc.add('https://api.nowpayments.io')
  connectSrc.add('https://api-sandbox.nowpayments.io')
  connectSrc.add('https://bpay.binanceapi.com')
  connectSrc.add('https://verification.didit.me')
  connectSrc.add('https://api.didit.me')
  connectSrc.add('https://accounts.google.com')
  connectSrc.add('https://oauth2.googleapis.com')
  connectSrc.add('https://www.googleapis.com')
  connectSrc.add('https://va.vercel-scripts.com')

  frameSrc.add('https://accounts.google.com')
  frameSrc.add('https://verification.didit.me')

  formAction.add('https://accounts.google.com')

  const appOrigin = originFromEnvUrl(process.env.NEXT_PUBLIC_APP_URL)
  if (appOrigin) {
    connectSrc.add(appOrigin)
    formAction.add(appOrigin)
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSrc).join(' ')}`,
    `frame-src ${Array.from(frameSrc).join(' ')}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${Array.from(formAction).join(' ')}`,
    'upgrade-insecure-requests',
  ]

  if (process.env.NODE_ENV !== 'production') {
    directives[1] = `script-src ${scriptSrc.join(' ')} 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com`
    connectSrc.add('ws:')
    connectSrc.add('wss:')
    connectSrc.add('http://localhost:*')
    connectSrc.add('https://localhost:*')
    directives[6] = `connect-src ${Array.from(connectSrc).join(' ')}`
  }

  return directives.join('; ')
}

export function applyContentSecurityPolicyHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce))
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(self https://verification.didit.me), microphone=(), geolocation=()'
  )
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site')
  return response
}
