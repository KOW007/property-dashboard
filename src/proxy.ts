import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Admin routes that require authentication
const adminRoutes = [
  '/dashboard',
  '/rent-roll',
  '/vacancies',
  '/work-orders',
  '/renewals',
  '/applications',
  '/service-request',
  '/accounting',
]

// Tenant portal routes that require authentication
const portalRoutes = ['/portal']

function isAdminRoute(pathname: string) {
  return adminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
}

function isPortalRoute(pathname: string) {
  return portalRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLogin = pathname === '/login'
  const isPortalLogin = pathname === '/portal-login'

  // Logged-in user on admin login page → redirect to dashboard
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Logged-in user on portal login page → redirect to portal
  if (user && isPortalLogin) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  // Not logged in, trying to access admin route → redirect to login
  if (!user && isAdminRoute(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Not logged in, trying to access portal → redirect to portal login
  if (!user && isPortalRoute(pathname)) {
    return NextResponse.redirect(new URL('/portal-login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
}
