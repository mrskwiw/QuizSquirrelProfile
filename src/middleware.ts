import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { CONFIG } from './lib/config'
import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from './lib/rate-limit'
import { logRateLimitViolation } from './lib/security-logger'

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`
}

async function checkAdminAuth(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const token = request.cookies.get('auth-token')
    if (!token?.value) {
      return { isAdmin: false }
    }

    const verified = await jwtVerify(token.value, CONFIG.JWT_SECRET)
    const payload = verified.payload as { userId: string; role?: string }

    const isAdmin = payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN'
    return { isAdmin, userId: payload.userId }
  } catch (error) {
    return { isAdmin: false }
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protect /admin routes - require admin role
  if (path.startsWith('/admin')) {
    const { isAdmin } = await checkAdminAuth(request)

    if (!isAdmin) {
      // Redirect to unauthorized page if not an admin
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Get client IP (Vercel provides this header)
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Determine rate limit based on path
  let limitConfig: RateLimitConfig = RATE_LIMITS.general
  let rateLimitPath = path

  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    limitConfig = RATE_LIMITS.auth
    rateLimitPath = '/api/auth' // Group auth endpoints together
  } else if (path.startsWith('/api/search')) {
    limitConfig = RATE_LIMITS.search
  }

  // Check rate limit (distributed via Redis)
  const key = getRateLimitKey(ip, rateLimitPath)
  const rateLimitResult = await checkRateLimit(key, limitConfig)
  const { allowed, remaining, resetTime, limit } = rateLimitResult

  // Log rate limit violations
  if (!allowed) {
    await logRateLimitViolation({
      ip,
      path: rateLimitPath,
      limit,
      remaining
    })
  }

  // Create response
  const response = allowed
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // API routes except early-adopter (public endpoint)
    '/api/((?!early-adopter).*)',
    // Admin routes
    '/admin/:path*',
    // All pages except Next.js internals and public pages
    '/((?!_next/static|_next/image|favicon.ico|launching-soon).*)',
  ],
}
