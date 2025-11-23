import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'
import { logCommunityActivity } from '@/lib/community-activity'

/**
 * POST /api/communities/[id]/transfer-ownership
 * Transfer community ownership to another member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    const body = await request.json()
    const { newOwnerId } = body

    if (!newOwnerId || !validateUUID(newOwnerId)) {
      throw new APIError('Invalid new owner user ID', 400, 'INVALID_NEW_OWNER_ID')
    }

    // Cannot transfer to yourself
    if (newOwnerId === user.id) {
      throw new APIError('You are already the owner', 400, 'ALREADY_OWNER')
    }

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      throw new APIError('Community not found', 404, 'NOT_FOUND')
    }

    // Check if requesting user is the owner or super admin
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const canTransfer =
      userMembership?.role === 'OWNER' ||
      user.role === 'SUPER_ADMIN'

    if (!canTransfer) {
      throw new APIError('Only the community owner or super admin can transfer ownership', 403, 'FORBIDDEN')
    }

    // Check if new owner is a member
    const newOwnerMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: newOwnerId,
          communityId: id
        }
      }
    })

    if (!newOwnerMembership) {
      throw new APIError('New owner must be a member of the community', 400, 'NEW_OWNER_NOT_MEMBER')
    }

    // Transfer ownership in a transaction
    await prisma.$transaction(async (tx) => {
      // Demote current owner to moderator
      await tx.communityMember.update({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: id
          }
        },
        data: {
          role: 'MODERATOR'
        }
      })

      // Promote new owner
      await tx.communityMember.update({
        where: {
          userId_communityId: {
            userId: newOwnerId,
            communityId: id
          }
        },
        data: {
          role: 'OWNER'
        }
      })

      // Update community creator
      await tx.community.update({
        where: { id },
        data: {
          creatorId: newOwnerId
        }
      })

      // Log activity for old owner
      await logCommunityActivity(tx, {
        communityId: id,
        userId: user.id,
        activityType: 'ROLE_CHANGED',
        metadata: {
          oldRole: 'OWNER',
          newRole: 'MODERATOR',
          changedBy: user.id,
          reason: 'ownership_transfer'
        }
      })

      // Log activity for new owner
      await logCommunityActivity(tx, {
        communityId: id,
        userId: newOwnerId,
        activityType: 'ROLE_CHANGED',
        metadata: {
          oldRole: newOwnerMembership.role,
          newRole: 'OWNER',
          changedBy: user.id,
          reason: 'ownership_transfer'
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully'
    })
  } catch (error) {
    return handleAPIError(error, 'POST /api/communities/[id]/transfer-ownership')
  }
}
