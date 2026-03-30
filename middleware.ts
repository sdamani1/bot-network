import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require a logged-in user.
// The bn_auth cookie is set by lib/authContext.tsx on auth state change.
// This is a UX-level guard; actual data security is enforced by Supabase RLS.
const PROTECTED = ['/dashboard', '/inbox', '/hire', '/messages', '/notifications']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const authCookie = request.cookies.get('bn_auth')
  if (!authCookie?.value) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inbox/:path*',
    '/hire/:path*',
    '/messages/:path*',
    '/notifications/:path*',
  ],
}
