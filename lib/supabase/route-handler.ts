import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './config'

type RouteHandlerClient = {
  supabase: SupabaseClient
  getResponse: () => NextResponse
  applyCookiesTo: (target: NextResponse) => NextResponse
}

/**
 * Supabase client for Route Handlers. Mirrors request cookies into the response
 * so PKCE verifiers survive OAuth redirects (required for exchangeCodeForSession).
 */
export function createRouteHandlerSupabaseClient(
  request: NextRequest,
  createResponse: () => NextResponse = () => NextResponse.next({ request })
): RouteHandlerClient {
  let response = createResponse()

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
        })
        response = createResponse()
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  return {
    supabase,
    getResponse: () => response,
    applyCookiesTo(target: NextResponse) {
      response.cookies.getAll().forEach((cookie) => {
        target.cookies.set(cookie)
      })
      return target
    },
  }
}

export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}
