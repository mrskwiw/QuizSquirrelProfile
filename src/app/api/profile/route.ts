import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { requireAuth, invalidateUserCache } from '@/lib/auth'
import { sanitizeInput, sanitizeHTML } from '@/lib/validation'

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Use RLS-aware Prisma client
    const profile = await withUserContext(prismaRLS, user.id, async (db) => {
      return await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          bio: true,
          location: true,
          website: true,
          pronouns: true,
          interests: true,
          twitterHandle: true,
          tumblrHandle: true,
          instagramHandle: true,
          tiktokHandle: true,
          facebookHandle: true,
          isVerified: true,
          subscriptionTier: true,
          createdAt: true,
        },
      })
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to view profile' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Validate inputs
    if (body.displayName && body.displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    if (body.bio && body.bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be less than 500 characters' },
        { status: 400 }
      )
    }

    if (body.interests && body.interests.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 interests allowed' },
        { status: 400 }
      )
    }

    // Validate URL if website is provided
    if (body.website) {
      try {
        new URL(body.website)
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        )
      }
    }

    // Use RLS-aware Prisma client
    const updatedProfile = await withUserContext(prismaRLS, user.id, async (db) => {
      // Sanitize all user inputs
      return await db.user.update({
        where: { id: user.id },
        data: {
          displayName: body.displayName ? sanitizeInput(body.displayName.trim()) : undefined,
          bio: body.bio ? sanitizeHTML(body.bio.trim()) : null,
          location: body.location ? sanitizeInput(body.location.trim()) : null,
          website: body.website ? sanitizeInput(body.website.trim()) : null,
          pronouns: body.pronouns ? sanitizeInput(body.pronouns.trim()) : null,
          interests: body.interests?.map((interest: string) => sanitizeInput(interest)) || [],
          twitterHandle: body.twitterHandle ? sanitizeInput(body.twitterHandle.trim()) : null,
          tumblrHandle: body.tumblrHandle ? sanitizeInput(body.tumblrHandle.trim()) : null,
          instagramHandle: body.instagramHandle ? sanitizeInput(body.instagramHandle.trim()) : null,
          tiktokHandle: body.tiktokHandle ? sanitizeInput(body.tiktokHandle.trim()) : null,
          facebookHandle: body.facebookHandle ? sanitizeInput(body.facebookHandle.trim()) : null,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          location: true,
          website: true,
          pronouns: true,
          interests: true,
          twitterHandle: true,
          tumblrHandle: true,
          instagramHandle: true,
          tiktokHandle: true,
          facebookHandle: true,
        },
      })
    })

    // Invalidate user cache after profile update
    invalidateUserCache(user.id)

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      ...updatedProfile,
    })
  } catch (error) {
    console.error('Profile update error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to update profile' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
