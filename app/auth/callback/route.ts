import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { bootstrapUserProfile } from '@/lib/auth/bootstrap-profile'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'

function createCallbackClient(request: NextRequest, response: NextResponse) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}

function loginErrorRedirect(request: NextRequest, code: string, message?: string) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('error', code)
  if (message) {
    loginUrl.searchParams.set('message', message.slice(0, 240))
  }
  return NextResponse.redirect(loginUrl)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const providerError = searchParams.get('error')
  const providerErrorDescription = searchParams.get('error_description')

  if (providerError) {
    return loginErrorRedirect(
      request,
      'oauth_failed',
      providerErrorDescription ?? providerError
    )
  }

  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')
  const nextPath = redirect?.startsWith('/') ? redirect : '/dashboard'

  if (!code) {
    return loginErrorRedirect(request, 'oauth_missing_code')
  }

  const successUrl = new URL(nextPath, request.url)
  const response = NextResponse.redirect(successUrl)
  const supabase = createCallbackClient(request, response)

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return loginErrorRedirect(request, 'oauth_failed', error.message)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.email) {
    const metadata = user.user_metadata ?? {}
    try {
      await bootstrapUserProfile({
        userId: user.id,
        email: user.email,
        fullName:
          (metadata.full_name as string | undefined) ??
          (metadata.name as string | undefined) ??
          user.email.split('@')[0] ??
          'Investor',
        investorTier: (metadata.investor_tier as string | undefined) ?? 'Starter',
      })
    } catch {
      // Profile may already exist from the auth.users trigger — do not block sign-in.
    }
  }

  return response
}
