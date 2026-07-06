import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { REMEMBER_SESSION_COOKIE } from '@/lib/auth/session-policy'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config'

const SESSION_IDLE_COOKIE = 'primefx_last_activity'

function createSignOutClient(request: NextRequest, response: NextResponse) {
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

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(SESSION_IDLE_COOKIE)
  response.cookies.delete(REMEMBER_SESSION_COOKIE)
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  const supabase = createSignOutClient(request, response)
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  clearSessionCookies(response)
  return response
}

export async function GET(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(loginUrl)
  const supabase = createSignOutClient(request, response)
  const { error } = await supabase.auth.signOut()

  if (error) {
    loginUrl.searchParams.set('error', 'logout_failed')
    return NextResponse.redirect(loginUrl)
  }

  clearSessionCookies(response)
  return response
}
