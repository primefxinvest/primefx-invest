import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAuthRoute, isMfaVerifyRoute, isProtectedRoute, MFA_VERIFY_ROUTE } from '@/lib/auth/routes'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

async function needsServerMfaChallenge(supabase: ReturnType<typeof createServerClient>) {
  try {
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
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const onMfaVerify = isMfaVerifyRoute(pathname)
  const onAuthRoute = isAuthRoute(pathname)

  if (!user && (isProtectedRoute(pathname) || onMfaVerify)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    if (isProtectedRoute(pathname)) {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    const pendingMfa = await needsServerMfaChallenge(supabase)

    if (pendingMfa && isProtectedRoute(pathname) && !onMfaVerify) {
      const verifyUrl = request.nextUrl.clone()
      verifyUrl.pathname = MFA_VERIFY_ROUTE
      verifyUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(verifyUrl)
    }

    if (onAuthRoute) {
      const target = request.nextUrl.clone()
      if (pendingMfa) {
        target.pathname = MFA_VERIFY_ROUTE
        target.search = ''
      } else {
        target.pathname = '/dashboard'
        target.search = ''
      }
      return NextResponse.redirect(target)
    }
  }

  return supabaseResponse
}
