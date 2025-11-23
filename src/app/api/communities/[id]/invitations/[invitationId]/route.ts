import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'
import { logCommunityActivity } from '@/lib/community-activity'

/**
 * PATCH /api/communities/[id]/invitations/[invitationId]
 * Accept or decline a community invitation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id, invitationId } = await params

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    if (!validateUUID(invitationId)) {
      throw new APIError('Invalid invitation ID', 400, 'INVALID_INVITATION_ID')
    }

    const body = await request.json()
    const { action } = body

    if (!['accept', 'decline'].includes(action)) {
      throw new APIError('Invalid action. Must be "accept" or "decline"', 400, 'INVALID_ACTION')
    }

    // Get invitation
    const invitation = await prisma.communityInvitation.findUnique({
      where: { id: invitationId },
      include: {
        Community: true
      }
    })

    if (!invitation) {
      throw new APIError('Invitation not found', 404, 'NOT_FOUND')
    }

    // Verify invitation is for this community
    if (invitation.communityId !== id) {
      throw new APIError('Invitation does not belong to this community', 400, 'INVALID_INVITATION')
    }

    // Verify invitation is for this user
    if (invitation.inviteeId !== user.id) {
      throw new APIError('This invitation is not for you', 403, 'FORBIDDEN')
    }

    // Check if invitation is already used or expired
    if (invitation.status !== 'PENDING') {
      throw new APIError(`Invitation has already been ${invitation.status.toLowerCase()}`, 400, 'INVITATION_USED')
    }

    if (invitation.expiresAt < new Date()) {
      // Update invitation status to EXPIRED
      await prisma.communityInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' }
      })
      throw new APIError('Invitation has expired', 400, 'INVITATION_EXPIRED')
    }

    if (action === 'accept') {
      // Add user to community and update invitation in a transaction
      await prisma.$transaction(async (tx) => {
        // Check if user is already a member
        const existingMembership = await tx.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: user.id,
              communityId: id
            }
          }
        })

        if (existingMembership) {
          throw new APIError('You are already a member of this community', 409, 'ALREADY_MEMBER')
        }

        // Add user to community
        await tx.communityMember.create({
          data: {
            userId: user.id,
            communityId: id,
            role: invitation.role
          }
        })

        // Update invitation status
        await tx.communityInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date()
          }
        })

        // Log community activity
        await logCommunityActivity(tx, {
          communityId: id,
          userId: user.id,
          activityType: 'MEMBER_JOINED',
          metadata: {
            via: 'invitation',
            inviterId: invitation.inviterId,
            role: invitation.role
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: `Successfully joined ${invitation.Community.name}`
      })
    } else {
      // Decline invitation
      await prisma.communityInvitation.update({
        where: { id: invitationId },
        data: { status: 'DECLINED' }
      })

      return NextResponse.json({
        success: true,
        message: 'Invitation declined'
      })
    }
  } catch (error) {
    return handleAPIError(error, 'PATCH /api/communities/[id]/invitations/[invitationId]')
  }
}

/**
 * DELETE /api/communities/[id]/invitations/[invitationId]
 * Cancel/revoke a community invitation (inviter, owner, moderator, or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id, invitationId } = await params

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    if (!validateUUID(invitationId)) {
      throw new APIError('Invalid invitation ID', 400, 'INVALID_INVITATION_ID')
    }

    // Get invitation
    const invitation = await prisma.communityInvitation.findUnique({
      where: { id: invitationId }
    })

    if (!invitation) {
      throw new APIError('Invitation not found', 404, 'NOT_FOUND')
    }

    // Verify invitation is for this community
    if (invitation.communityId !== id) {
      throw new APIError('Invitation does not belong to this community', 400, 'INVALID_INVITATION')
    }

    // Check if user has permission to delete invitation
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const canDelete =
      invitation.inviterId === user.id || // Inviter can cancel their own invitation
      membership?.role === 'OWNER' ||
      membership?.role === 'MODERATOR' ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'

    if (!canDelete) {
      throw new APIError('You do not have permission to cancel this invitation', 403, 'FORBIDDEN')
    }

    // Delete invitation
    await prisma.communityInvitation.delete({
      where: { id: invitationId }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })
  } catch (error) {
    return handleAPIError(error, 'DELETE /api/communities/[id]/invitations/[invitationId]')
  }
}
