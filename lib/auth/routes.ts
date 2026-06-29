export const AUTH_ROUTES = ['/login', '/signup'] as const

export const MFA_VERIFY_ROUTE = '/2fa-verify'

export const PUBLIC_ROUTE_PREFIXES = [
  '/',
  '/about',
  '/legal',
  '/terms',
  '/privacy',
  '/contact',
] as const

export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/invest',
  '/portfolio',
  '/wallet',
  '/transactions',
  '/primeai',
  '/academy',
  '/reports',
  '/rewards',
  '/community',
  '/referral',
  '/market-insights',
  '/support',
  '/notifications',
  '/settings',
  '/profile',
  '/verify',
  '/admin',
] as const

export const VERIFICATION_REQUIRED_ROUTE_PREFIXES = [
  '/wallet',
  '/invest',
] as const

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number])
}

export function isMfaVerifyRoute(pathname: string) {
  return pathname === MFA_VERIFY_ROUTE
}

export function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function requiresIdentityVerification(pathname: string) {
  return VERIFICATION_REQUIRED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isPublicRoute(pathname: string) {
  if (isAuthRoute(pathname) || isMfaVerifyRoute(pathname)) {
    return true
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || (prefix !== '/' && pathname.startsWith(`${prefix}/`))
  )
}
