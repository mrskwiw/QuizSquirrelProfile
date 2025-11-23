import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'
import { logCommunityActivity } from '@/lib/community-activity'

/**
 * PATCH /api/communities/[id]/members/[userId]/role
 * Update a member's role in a community
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id, userId: targetUserId } = await params

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    if (!validateUUID(targetUserId)) {
      throw new APIError('Invalid user ID', 400, 'INVALID_USER_ID')
    }

    const body = await request.json()
    const { role } = body

    // Validate role
    if (!['MEMBER', 'MODERATOR'].includes(role)) {
      throw new APIError('Invalid role. Only MEMBER or MODERATOR can be assigned', 400, 'INVALID_ROLE')
    }

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      throw new APIError('Community not found', 404, 'NOT_FOUND')
    }

    // Check if requesting user has permission (OWNER or ADMIN/SUPER_ADMIN)
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const canManageRoles =
      userMembership?.role === 'OWNER' ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'

    if (!canManageRoles) {
      throw new APIError('Only community owners or admins can manage member roles', 403, 'FORBIDDEN')
    }

    // Get target member
    const targetMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId: id
        }
      }
    })

    if (!targetMembership) {
      throw new APIError('User is not a member of this community', 404, 'NOT_MEMBER')
    }

    // Cannot change the role of the community owner
    if (targetMembership.role === 'OWNER') {
      throw new APIError('Cannot change the role of the community owner', 400, 'CANNOT_CHANGE_OWNER_ROLE')
    }

    // Cannot promote yourself
    if (targetUserId === user.id) {
      throw new APIError('You cannot change your own role', 400, 'CANNOT_CHANGE_OWN_ROLE')
    }

    // Update role and log activity in a transaction
    const updatedMember = await prisma.$transaction(async (tx) => {
      const member = await tx.communityMember.update({
        where: {
          userId_communityId: {
            userId: targetUserId,
            communityId: id
          }
        },
        data: {
          role
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      })

      // Log activity
      await logCommunityActivity(tx, {
        communityId: id,
        userId: targetUserId,
        activityType: 'ROLE_CHANGED',
        metadata: {
          oldRole: targetMembership.role,
          newRole: role,
          changedBy: user.id
        }
      })

      return member
    })

    return NextResponse.json({
      success: true,
      member: {
        ...updatedMember.User,
        communityRole: updatedMember.role,
        joinedAt: updatedMember.joinedAt
      }
    })
  } catch (error) {
    return handleAPIError(error, 'PATCH /api/communities/[id]/members/[userId]/role')
  }
}
