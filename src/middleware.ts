import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Rate limiting store (in-memory - for production use Redis or Vercel KV)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Rate limit configurations
const RATE_LIMITS = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  search: { requests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  general: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
}

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`
}

function checkRateLimit(
  key: string,
  limit: { requests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimit.get(key)

  // No record or window expired - create new record
  if (!record || now > record.resetTime) {
    const resetTime = now + limit.windowMs
    rateLimit.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit.requests - 1, resetTime }
  }

  // Within window - check if limit exceeded
  if (record.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  // Increment count
  record.count++
  rateLimit.set(key, record)
  return { allowed: true, remaining: limit.requests - record.count, resetTime: record.resetTime }
}

async function checkAdminAuth(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const token = request.cookies.get('auth-token')
    if (!token?.value) {
      return { isAdmin: false }
    }

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '')
    const verified = await jwtVerify(token.value, JWT_SECRET)
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
  let limitConfig = RATE_LIMITS.general
  let rateLimitPath = path

  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    limitConfig = RATE_LIMITS.auth
    rateLimitPath = '/api/auth' // Group auth endpoints together
  } else if (path.startsWith('/api/search')) {
    limitConfig = RATE_LIMITS.search
  }

  // Check rate limit
  const key = getRateLimitKey(ip, rateLimitPath)
  const { allowed, remaining, resetTime } = checkRateLimit(key, limitConfig)

  // Create response
  const response = allowed
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limitConfig.requests.toString())
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
