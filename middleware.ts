import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, NextRequest } from 'next/server'
import { routing, type AppLocale } from '@/i18n/routing'
import { localizePath, shouldSkipLocalePrefix, stripLocalePrefix } from '@/lib/i18n/pathname'
import { updateSession } from '@/lib/supabase/middleware'

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

function withPathnameHeader(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-pathname', request.nextUrl.pathname)
  return new NextRequest(request.url, { headers })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestWithPath = withPathnameHeader(request)

  if (shouldSkipSession(pathname)) {
    return NextResponse.next()
  }

  const doubleLocaleRedirect = fixDoubleLocaleRedirect(request)
  if (doubleLocaleRedirect) {
    return doubleLocaleRedirect
  }

  const excludedPathRedirect = fixLocalePrefixedExcludedPathRedirect(request)
  if (excludedPathRedirect) {
    return excludedPathRedirect
  }

  if (shouldSkipI18n(pathname)) {
    return updateSession(requestWithPath)
  }

  const intlResponse = intlMiddleware(requestWithPath)

  if (intlResponse.headers.get('location')) {
    return intlResponse
  }

  return updateSession(requestWithPath, intlResponse)
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}

