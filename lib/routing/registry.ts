/** Central registry of locale-scoped app routes for navigation audits. */
export const LOCALE_APP_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/2fa-verify',
  '/about',
  '/contact',
  '/legal',
  '/terms',
  '/privacy',
  '/dashboard',
  '/invest',
  '/portfolio',
  '/wallet',
  '/wallet/deposit',
  '/wallet/withdraw',
  '/wallet/transfer',
  '/transactions',
  '/primeai',
  '/academy',
  '/academy/[courseId]',
  '/rewards',
  '/community',
  '/referral',
  '/market-insights',
  '/support',
  '/notifications',
  '/settings',
  '/profile',
  '/verify',
  '/verify/callback',
] as const

export const LANDING_NAV_ROUTES = [
  '/',
  '/invest',
  '/about',
  '/academy',
  '/market-insights',
  '/community',
  '/support',
] as const

export const AUTH_ENTRY_ROUTES = ['/login', '/signup'] as const

export const PUBLIC_MARKETING_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/legal',
  '/terms',
  '/privacy',
  '/login',
  '/signup',
] as const

/** Routes that require authentication (middleware + dashboard layout). */
export const AUTHENTICATED_APP_ROUTES = [
  '/dashboard',
  '/invest',
  '/portfolio',
  '/wallet',
  '/transactions',
  '/primeai',
  '/academy',
  '/rewards',
  '/community',
  '/referral',
  '/market-insights',
  '/support',
  '/notifications',
  '/settings',
  '/profile',
  '/verify',
] as const

export function isAuthenticatedAppRoute(pathname: string) {
  return AUTHENTICATED_APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}
