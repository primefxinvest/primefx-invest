import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, allow all routes
  // Client-side Supabase auth will handle protection
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
