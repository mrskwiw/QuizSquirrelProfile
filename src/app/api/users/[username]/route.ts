import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser } from '@/lib/auth'
import { sanitizeInput } from '@/lib/validation'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}
import type { UserProfileWithStats } from '@/types/user-profiles'

// GET /api/users/[username] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { username: rawUsername } = await params

    const currentUser = await getCurrentUser()

    // Sanitize username parameter
    const username = sanitizeInput(rawUsername)

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, currentUser?.id, async (db) => {
      // Fetch user with counts
      const user = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          role: true,
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
          subscriptionTier: true, // Will be conditionally hidden below
          createdAt: true,
          _count: {
            select: {
              Quiz: {
                where: {
                  status: 'PUBLISHED',
                },
              },
              QuizResponse: true,
              Follow_Follow_followerIdToUser: true,
              Follow_Follow_followingIdToUser: true,
            },
          },
        },
      })

      if (!user) {
        return null
      }

      // Check if current user follows this user
      let isFollowing = false
      if (currentUser) {
        const follow = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.id,
              followingId: user.id,
            },
          },
        })
        isFollowing = !!follow
      }

      return { user, isFollowing }
    })

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { user, isFollowing } = result

    // Determine viewing context
    const isOwner = currentUser?.id === user.id
    const isAdmin = currentUser?.role === 'ADMIN'

    // Build response with appropriate fields based on viewer
    const sanitizedProfile: UserProfileWithStats = {
      // Public fields (always visible)
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,

      // Extended public fields (social handles, etc.)
      location: user.location,
      website: user.website,
      pronouns: user.pronouns,
      interests: user.interests,
      twitterHandle: user.twitterHandle,
      tumblrHandle: user.tumblrHandle,
      instagramHandle: user.instagramHandle,
      tiktokHandle: user.tiktokHandle,
      facebookHandle: user.facebookHandle,
      isVerified: user.isVerified,

      // Conditional fields
      ...(isOwner || isAdmin ? { subscriptionTier: user.subscriptionTier } : {}),

      // Stats
      stats: {
        quizCount: (user as any)._count.Quiz,
        followerCount: (user as any)._count.Follow_Follow_followerIdToUser,
        followingCount: (user as any)._count.Follow_Follow_followingIdToUser,
      },

      // Context fields
      isCurrentUser: isOwner,
      isFollowing,
    } as UserProfileWithStats & { isCurrentUser: boolean; isFollowing: boolean }

    return NextResponse.json({
      user: sanitizedProfile,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
