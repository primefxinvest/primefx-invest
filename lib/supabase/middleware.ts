import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedEntryPath } from '@/lib/auth/session'
import { isAuthRoute, isMfaVerifyRoute, isProtectedRoute, MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        supabaseResponse = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
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

  const { pathname } = request.nextUrl
  const onMfaVerify = isMfaVerifyRoute(pathname)
  const onAuthRoute = isAuthRoute(pathname)

  if (!activeUser && (isProtectedRoute(pathname) || onMfaVerify)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    if (isProtectedRoute(pathname)) {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (activeUser) {
    const pendingMfa = await needsServerMfaChallenge(supabase, activeUser.id)

    if (pendingMfa && isProtectedRoute(pathname) && !onMfaVerify) {
      const verifyUrl = request.nextUrl.clone()
      verifyUrl.pathname = MFA_VERIFY_ROUTE
      verifyUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(verifyUrl)
    }

    if (onAuthRoute) {
      const redirectParam = request.nextUrl.searchParams.get('redirect')
      const destination = getAuthenticatedEntryPath(redirectParam, pendingMfa)
      const [path, query] = destination.split('?')
      const target = request.nextUrl.clone()
      target.pathname = path
      target.search = query ? `?${query}` : ''
      return NextResponse.redirect(target)
    }
  }

  return supabaseResponse
}
