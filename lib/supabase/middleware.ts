import { createServerClient } from '@supabase/ssr'

import { NextResponse, type NextRequest } from 'next/server'

import { getAuthenticatedEntryPath } from '@/lib/auth/session'

import { INVESTOR_RULES } from '@/lib/investor/rules'

import { isAuthRoute, isMfaVerifyRoute, isProtectedRoute, MFA_VERIFY_ROUTE, requiresIdentityVerification } from '@/lib/auth/routes'

import { getLocaleFromPathname, localizePath, stripLocalePrefix } from '@/lib/i18n/pathname'

import { getSupabaseAnonKey, getSupabaseUrl } from './config'

const SESSION_IDLE_COOKIE = 'primefx_last_activity'
const SESSION_IDLE_MS = INVESTOR_RULES.security.sessionTimeoutMinutes * 60 * 1000

async function enforceSessionIdleTimeout(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createServerClient>,
  activeUser: { id: string } | null,
  locale: ReturnType<typeof getLocaleFromPathname>,
  pathname: string
) {
  if (!activeUser) {
    response.cookies.delete(SESSION_IDLE_COOKIE)
    return { response, activeUser }
  }

  const now = Date.now()
  const lastActivityRaw = request.cookies.get(SESSION_IDLE_COOKIE)?.value
  const lastActivity = lastActivityRaw ? Number.parseInt(lastActivityRaw, 10) : NaN

  if (Number.isFinite(lastActivity) && now - lastActivity > SESSION_IDLE_MS) {
    await supabase.auth.signOut()
    response.cookies.delete(SESSION_IDLE_COOKIE)

    if (isProtectedRoute(pathname) || isMfaVerifyRoute(pathname)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = localizePath('/login', locale)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('reason', 'session_expired')
      const redirect = NextResponse.redirect(loginUrl)
      redirect.cookies.delete(SESSION_IDLE_COOKIE)
      return { response: redirect, activeUser: null }
    }

    return { response, activeUser: null }
  }

  response.cookies.set(SESSION_IDLE_COOKIE, String(now), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.ceil(SESSION_IDLE_MS / 1000) + 60,
  })

  return { response, activeUser }
}



async function needsServerMfaChallenge(

  supabase: ReturnType<typeof createServerClient>,

  userId: string

) {

  try {

    const { data: profile } = await supabase

      .from('users')

      .select('mfa_disabled_at')

      .eq('id', userId)

      .maybeSingle()



    if (profile?.mfa_disabled_at) return false



    const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (error) return false

    return aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2'

  } catch {

    return false

  }

}



async function needsIdentityVerification(

  supabase: ReturnType<typeof createServerClient>,

  userId: string

) {

  try {

    const { data } = await supabase

      .from('users')

      .select('is_verified, kyc_status, verification_status')

      .eq('id', userId)

      .maybeSingle()



    if (!data) return true

    if (data.is_verified) return false

    if (String(data.verification_status).toLowerCase() === 'approved') return false

    return String(data.kyc_status).toLowerCase() !== 'verified'

  } catch {

    return false

  }

}



export async function updateSession(request: NextRequest, intlResponse?: NextResponse) {

  let response = intlResponse ?? NextResponse.next({ request })



  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {

    cookies: {

      getAll() {

        return request.cookies.getAll()

      },

      setAll(cookiesToSet) {

        cookiesToSet.forEach(({ name, value, options }) => {

          request.cookies.set(name, value)

          response.cookies.set(name, value, options)

        })

      },

    },

  })



  const {

    data: { user },

    error: userError,

  } = await supabase.auth.getUser()



  let activeUser = user

  if (userError) {

    await supabase.auth.signOut()

    activeUser = null

  }



  const rawPathname = request.nextUrl.pathname

  const pathname = stripLocalePrefix(rawPathname)

  const locale = getLocaleFromPathname(rawPathname)

  const idleResult = await enforceSessionIdleTimeout(
    request,
    response,
    supabase,
    activeUser,
    locale,
    pathname
  )

  response = idleResult.response

  activeUser = idleResult.activeUser



  const onMfaVerify = isMfaVerifyRoute(pathname)

  const onAuthRoute = isAuthRoute(pathname)



  if (!activeUser && (isProtectedRoute(pathname) || onMfaVerify)) {

    const loginUrl = request.nextUrl.clone()

    loginUrl.pathname = localizePath('/login', locale)

    if (isProtectedRoute(pathname)) {

      loginUrl.searchParams.set('redirect', pathname)

    }

    return NextResponse.redirect(loginUrl)

  }



  if (activeUser) {

    const pendingMfa = await needsServerMfaChallenge(supabase, activeUser.id)



    if (pendingMfa && isProtectedRoute(pathname) && !onMfaVerify) {

      const verifyUrl = request.nextUrl.clone()

      verifyUrl.pathname = localizePath(MFA_VERIFY_ROUTE, locale)

      verifyUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(verifyUrl)

    }



    if (onAuthRoute) {

      const redirectParam = request.nextUrl.searchParams.get('redirect')

      const destination = getAuthenticatedEntryPath(redirectParam, pendingMfa)

      const [path, query] = destination.split('?')

      const target = request.nextUrl.clone()

      target.pathname = localizePath(path, locale)

      target.search = query ? `?${query}` : ''

      return NextResponse.redirect(target)

    }



    if (

      requiresIdentityVerification(pathname) &&

      !pathname.startsWith('/verify') &&

      (await needsIdentityVerification(supabase, activeUser.id))

    ) {

      const verifyUrl = request.nextUrl.clone()

      verifyUrl.pathname = localizePath('/verify', locale)

      verifyUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(verifyUrl)

    }

  }



  return response

}

