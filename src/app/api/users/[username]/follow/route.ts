import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { requireAuth } from '@/lib/auth'
import { sanitizeInput } from '@/lib/validation'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}
import { notifyNewFollower } from '@/lib/notifications'

// POST /api/users/[username]/follow - Toggle follow/unfollow
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { username: rawUsername } = await params

    const currentUser = await requireAuth()

    // Sanitize username parameter
    const username = sanitizeInput(rawUsername)

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, currentUser.id, async (db) => {
      // Find user to follow by username
      const targetUser = await db.user.findUnique({
        where: { username },
        select: { id: true, username: true, displayName: true },
      })

      if (!targetUser) {
        throw new Error('User not found')
      }

      // Can't follow yourself
      if (targetUser.id === currentUser.id) {
        throw new Error("You can't follow yourself")
      }

      // Check if already following
      const existingFollow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        },
      })

      if (existingFollow) {
        // Unfollow - batch delete + count
        const [, followerCount] = await Promise.all([
          db.follow.delete({
            where: { id: existingFollow.id },
          }),
          db.follow.count({
            where: { followingId: targetUser.id },
          }),
        ])

        return {
          success: true,
          isFollowing: false,
          followerCount,
          message: `Unfollowed ${targetUser.displayName}`,
          shouldNotify: false,
          targetUserId: null,
        }
      } else {
        // Follow - batch create + count
        const [, followerCount] = await Promise.all([
          db.follow.create({
            data: {
              followerId: currentUser.id,
              followingId: targetUser.id,
            },
          }),
          db.follow.count({
            where: { followingId: targetUser.id },
          }),
        ])

        return {
          success: true,
          isFollowing: true,
          followerCount,
          message: `Now following ${targetUser.displayName}`,
          shouldNotify: true,
          targetUserId: targetUser.id,
        }
      }
    })

    // Send notification outside transaction if needed
    if (result.shouldNotify && result.targetUserId) {
      await notifyNewFollower(
        result.targetUserId,
        currentUser.id,
        currentUser.displayName,
        currentUser.avatarUrl
      )
    }

    // Return result without internal flags
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { shouldNotify, targetUserId, ...response } = result
    return NextResponse.json(response)

  } catch (error) {
    console.error('Follow toggle error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to follow users' },
          { status: 401 }
        )
      }
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      if (error.message === "You can't follow yourself") {
        return NextResponse.json(
          { error: "You can't follow yourself" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to toggle follow. Please try again.' },
      { status: 500 }
    )
  }
}
