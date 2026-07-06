export const SITE_NAME = 'PrimeFx Invest'

export const SITE_TAGLINE = 'AI-Powered Investment Platform'

export const DEFAULT_DESCRIPTION =
  'Invest smarter with PrimeFx Invest — AI-driven strategies, transparent investment plans, secure wallets, and real-time portfolio tools for modern investors.'

export const SITE_KEYWORDS = [
  'PrimeFx Invest',
  'AI investment platform',
  'online investing',
  'crypto investment',
  'portfolio management',
  'wealth growth',
  'investment plans',
  'fintech',
  'digital assets',
  'PrimeAI',
] as const

const DEFAULT_SITE_URL = 'http://localhost:3000'

function normalizeSiteOrigin(candidate: string | undefined): string | null {
  const trimmed = candidate?.trim()
  if (!trimmed) return null

  let value = trimmed.replace(/\/$/, '')

  if (!/^https?:\/\//i.test(value)) {
    value = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(value)
      ? `http://${value}`
      : `https://${value}`
  }

  try {
    const url = new URL(value)
    if (!url.hostname) return null
    return url.origin
  } catch {
    return null
  }
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]

  for (const candidate of candidates) {
    const origin = normalizeSiteOrigin(candidate)
    if (origin) return origin
  }

  return DEFAULT_SITE_URL
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl()
  if (path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Public routes that should be indexed and listed in the sitemap */
export const PUBLIC_INDEXABLE_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/how-primefx-works', changeFrequency: 'monthly' as const, priority: 0.85 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/legal', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/risk-disclosure', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/cookies', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/aml-policy', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/kyc-policy', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/signup', changeFrequency: 'monthly' as const, priority: 0.9 },
]
