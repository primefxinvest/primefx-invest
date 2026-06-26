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

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
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
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/legal', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/signup', changeFrequency: 'monthly' as const, priority: 0.9 },
]
