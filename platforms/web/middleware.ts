import { NextRequest, NextResponse } from 'next/server'

/**
 * Subdomain-based portal separation middleware.
 *
 * Determines the portal context from the Host header and enforces route boundaries:
 *   - app subdomain  → FA portal only (blocks /admin/*)
 *   - admin subdomain → Admin portal only (blocks /advisor/*)
 *   - dev (localhost / unknown) → full access, no restrictions
 */

const APP_HOSTNAME = process.env.NEXT_PUBLIC_APP_HOSTNAME || ''
const ADMIN_HOSTNAME = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME || ''

type Portal = 'app' | 'admin' | 'dev'

function getPortal(host: string): Portal {
  // Strip port for comparison
  const hostname = host.split(':')[0]
  const appHost = APP_HOSTNAME.split(':')[0]
  const adminHost = ADMIN_HOSTNAME.split(':')[0]

  if (appHost && hostname === appHost) return 'app'
  if (adminHost && hostname === adminHost) return 'admin'
  return 'dev'
}

// Legacy top-level routes that should be blocked on production subdomains
const LEGACY_ROUTES = ['/dashboard', '/onboarding', '/nests']

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const portal = getPortal(host)

  // Dev mode — no restrictions
  if (portal === 'dev') return NextResponse.next()

  const { pathname } = request.nextUrl

  // --- Landing page redirect ---
  if (pathname === '/') {
    if (portal === 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    // app portal: show the landing page as-is (no redirect)
  }

  // --- Route blocking ---
  if (portal === 'app') {
    // Block admin routes on the app subdomain
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
    // Block advisor routes on the app subdomain (not yet public)
    if (pathname.startsWith('/advisor')) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
  }

  if (portal === 'admin') {
    // Block advisor routes on the admin subdomain
    if (pathname.startsWith('/advisor')) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
  }

  // Block legacy top-level routes on both production subdomains
  if (LEGACY_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico and common static assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
