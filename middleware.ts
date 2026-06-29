import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

const SKIP_I18N_PREFIXES = ['/api', '/admin', '/auth']

/** OAuth callback must not run session middleware — it clears PKCE cookies before exchange. */
const SKIP_SESSION_PREFIXES = ['/auth/callback', '/auth/login/google']

function shouldSkipI18n(pathname: string) {
  return SKIP_I18N_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function shouldSkipSession(pathname: string) {
  return SKIP_SESSION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldSkipSession(pathname)) {
    return NextResponse.next()
  }

  if (shouldSkipI18n(pathname)) {
    return updateSession(request)
  }

  const intlResponse = intlMiddleware(request)

  if (intlResponse.headers.get('location')) {
    return intlResponse
  }

  return updateSession(request, intlResponse)
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
