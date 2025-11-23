import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CONFIG } from '@/lib/config'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { logAuthAttempt } from '@/lib/security-logger'

// JWT secret loaded from centralized config (validates on startup)
const JWT_SECRET = CONFIG.JWT_SECRET

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      // Log failed login - user not found
      await logAuthAttempt({
        username: email,
        ip,
        userAgent,
        success: false,
        reason: 'user_not_found'
      })

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      // Log failed login - invalid password
      await logAuthAttempt({
        userId: user.id,
        username: user.username,
        ip,
        userAgent,
        success: false,
        reason: 'invalid_password'
      })

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Log successful login
    await logAuthAttempt({
      userId: user.id,
      username: user.username,
      ip,
      userAgent,
      success: true
    })

    return NextResponse.json({
      message: 'Login successful',
      User: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
