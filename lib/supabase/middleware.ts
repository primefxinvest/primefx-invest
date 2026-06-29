import { createServerClient } from '@supabase/ssr'

import { NextResponse, type NextRequest } from 'next/server'

import { getAuthenticatedEntryPath } from '@/lib/auth/session'

import { isAuthRoute, isMfaVerifyRoute, isProtectedRoute, MFA_VERIFY_ROUTE, requiresIdentityVerification } from '@/lib/auth/routes'

import { getLocaleFromPathname, localizePath, stripLocalePrefix } from '@/lib/i18n/pathname'

import { getSupabaseAnonKey, getSupabaseUrl } from './config'



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

  const onMfaVerify = isMfaVerifyRoute(pathname)

  const onAuthRoute = isAuthRoute(pathname)



  if (!activeUser && (isProtectedRoute(pathname) || onMfaVerify)) {

    const loginUrl = request.nextUrl.clone()

    loginUrl.pathname = localizePath('/login', locale)

    if (isProtectedRoute(pathname)) {

      loginUrl.searchParams.set('redirect', rawPathname)

    }

    return NextResponse.redirect(loginUrl)

  }



  if (activeUser) {

    const pendingMfa = await needsServerMfaChallenge(supabase, activeUser.id)



    if (pendingMfa && isProtectedRoute(pathname) && !onMfaVerify) {

      const verifyUrl = request.nextUrl.clone()

      verifyUrl.pathname = localizePath(MFA_VERIFY_ROUTE, locale)

      verifyUrl.searchParams.set('redirect', rawPathname)

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

      verifyUrl.searchParams.set('redirect', rawPathname)

      return NextResponse.redirect(verifyUrl)

    }

  }



  return response

}

