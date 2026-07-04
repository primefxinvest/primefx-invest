import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, NextRequest } from 'next/server'
import { routing, type AppLocale } from '@/i18n/routing'
import { localizePath, shouldSkipLocalePrefix, stripLocalePrefix } from '@/lib/i18n/pathname'
import { updateSession } from '@/lib/supabase/middleware'
import {
  applyContentSecurityPolicyHeaders,
  generateCspNonce,
} from '@/lib/security/content-security-policy'

const intlMiddleware = createIntlMiddleware(routing)

function shouldSkipI18n(pathname: string) {
  return shouldSkipLocalePrefix(pathname)
}

/** OAuth callback must not run session middleware — it clears PKCE cookies before exchange. */
const SKIP_SESSION_PREFIXES = ['/auth/callback', '/auth/login/google']

function fixLocalePrefixedExcludedPathRedirect(request: NextRequest) {
  const { pathname } = request.nextUrl
  const stripped = stripLocalePrefix(pathname)
  if (stripped !== pathname && shouldSkipI18n(stripped)) {
    const url = request.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.redirect(url)
  }
  return null
}

function shouldSkipSession(pathname: string) {
  return SKIP_SESSION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function hasDoubleLocalePrefix(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return (
    segments.length >= 2 &&
    routing.locales.includes(segments[0] as AppLocale) &&
    routing.locales.includes(segments[1] as AppLocale)
  )
}

function fixDoubleLocaleRedirect(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!hasDoubleLocalePrefix(pathname)) return null

  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0] as AppLocale
  const rest = segments.slice(2).join('/')
  const url = request.nextUrl.clone()
  url.pathname = localizePath(rest ? `/${rest}` : '/', locale)
  return NextResponse.redirect(url)
}

function withSecurityHeaders(request: NextRequest, nonce: string) {
  const headers = new Headers(request.headers)
  headers.set('x-pathname', request.nextUrl.pathname)
  headers.set('x-nonce', nonce)
  return new NextRequest(request.url, { headers })
}

function finalizeResponse(response: NextResponse, nonce: string) {
  return applyContentSecurityPolicyHeaders(response, nonce)
}

export async function middleware(request: NextRequest) {
  const nonce = generateCspNonce()
  const requestWithPath = withSecurityHeaders(request, nonce)
  const { pathname } = request.nextUrl

  if (shouldSkipSession(pathname)) {
    return finalizeResponse(NextResponse.next({ request: requestWithPath }), nonce)
  }

  const doubleLocaleRedirect = fixDoubleLocaleRedirect(request)
  if (doubleLocaleRedirect) {
    return finalizeResponse(doubleLocaleRedirect, nonce)
  }

  const excludedPathRedirect = fixLocalePrefixedExcludedPathRedirect(request)
  if (excludedPathRedirect) {
    return finalizeResponse(excludedPathRedirect, nonce)
  }

  if (shouldSkipI18n(pathname)) {
    return finalizeResponse(await updateSession(requestWithPath), nonce)
  }

  const intlResponse = intlMiddleware(requestWithPath)

  if (intlResponse.headers.get('location')) {
    return finalizeResponse(intlResponse, nonce)
  }

  return finalizeResponse(await updateSession(requestWithPath, intlResponse), nonce)
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
