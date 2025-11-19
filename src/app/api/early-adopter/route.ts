import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

interface EarlyAdopterRequest {
  email: string
  name?: string
  referralSource?: string
  interests?: string[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 API: POST /api/early-adopter - Request received')

    // Parse request body
    const body: EarlyAdopterRequest = await request.json()
    console.log('📥 API: Request body parsed')

    // Validate email
    if (!body.email || body.email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Sanitize email
    const sanitizedEmail = body.email.trim().toLowerCase()

    // Check if email already exists
    const existing = await prisma.earlyAdopter.findUnique({
      where: { email: sanitizedEmail },
    })

    if (existing) {
      console.log('✅ API: Email already registered:', { id: existing.id })
      return NextResponse.json({
        success: true,
        message: 'Thank you! You are already on our waitlist.',
      })
    }

    // Create new early adopter record
    const earlyAdopter = await prisma.earlyAdopter.create({
      data: {
        id: randomUUID(),
        email: sanitizedEmail,
        name: body.name?.trim() || null,
        referralSource: body.referralSource?.trim() || null,
        interests: body.interests || [],
      },
    })

    console.log('✅ API: Early adopter email saved:', { id: earlyAdopter.id })

    return NextResponse.json({
      success: true,
      message: 'Thank you! You will be notified when we launch.',
    })

  } catch (error) {
    console.error('❌ API: Early adopter signup error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.json(
      { error: 'Failed to save email. Please try again.' },
      { status: 500 }
    )
  }
}
