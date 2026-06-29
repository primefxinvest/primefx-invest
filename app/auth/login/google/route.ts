import { NextResponse, type NextRequest } from 'next/server'
import { sanitizeRedirectPath } from '@/lib/auth/session'
import {
  createRouteHandlerSupabaseClient,
  getRequestOrigin,
} from '@/lib/supabase/route-handler'

function loginErrorRedirect(request: NextRequest, message?: string) {
  const loginUrl = new URL('/login', getRequestOrigin(request))
  loginUrl.searchParams.set('error', 'oauth_failed')
  if (message) {
    loginUrl.searchParams.set('message', message.slice(0, 240))
  }
  return NextResponse.redirect(loginUrl)
}

export async function GET(request: NextRequest) {
  const redirect = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirect'))
  const origin = getRequestOrigin(request)
  const callbackUrl = new URL('/auth/callback', origin)
  callbackUrl.searchParams.set('redirect', redirect)

  const { supabase, applyCookiesTo } = createRouteHandlerSupabaseClient(request)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    return loginErrorRedirect(request, error.message)
  }

  if (!data.url) {
    return loginErrorRedirect(request, 'Google sign-in URL was not returned.')
  }

  return applyCookiesTo(NextResponse.redirect(data.url))
}
