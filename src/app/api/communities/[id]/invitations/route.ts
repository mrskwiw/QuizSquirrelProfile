import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'
import crypto from 'crypto'

/**
 * POST /api/communities/[id]/invitations
 * Send a community invitation
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
    const { inviteeId, inviteeEmail, role = 'MEMBER' } = body

    // Validate that either inviteeId or inviteeEmail is provided
    if (!inviteeId && !inviteeEmail) {
      throw new APIError('Either inviteeId or inviteeEmail must be provided', 400, 'MISSING_INVITEE')
    }

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

    // Check if user has permission to invite (OWNER, MODERATOR, or ADMIN)
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const canInvite =
      membership?.role === 'OWNER' ||
      membership?.role === 'MODERATOR' ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'

    if (!canInvite) {
      throw new APIError('Only community owners, moderators, or admins can send invitations', 403, 'FORBIDDEN')
    }

    // If inviteeId is provided, check if user exists and is not already a member
    if (inviteeId) {
      if (!validateUUID(inviteeId)) {
        throw new APIError('Invalid invitee user ID', 400, 'INVALID_INVITEE_ID')
      }

      const inviteeUser = await prisma.user.findUnique({
        where: { id: inviteeId }
      })

      if (!inviteeUser) {
        throw new APIError('Invitee user not found', 404, 'INVITEE_NOT_FOUND')
      }

      // Check if user is already a member
      const existingMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: inviteeId,
            communityId: id
          }
        }
      })

      if (existingMembership) {
        throw new APIError('User is already a member of this community', 409, 'ALREADY_MEMBER')
      }

      // Check for existing pending invitation
      const existingInvitation = await prisma.communityInvitation.findFirst({
        where: {
          communityId: id,
          inviteeId,
          status: 'PENDING',
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (existingInvitation) {
        throw new APIError('An invitation has already been sent to this user', 409, 'INVITATION_EXISTS')
      }
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const invitation = await prisma.communityInvitation.create({
      data: {
        communityId: id,
        inviterId: user.id,
        inviteeId: inviteeId || null,
        inviteeEmail: inviteeEmail || null,
        role,
        token,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        Community: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true
          }
        },
        Inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        Invitee: inviteeId ? {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true
          }
        } : undefined
      }
    })

    return NextResponse.json({
      success: true,
      invitation
    }, { status: 201 })
  } catch (error) {
    return handleAPIError(error, 'POST /api/communities/[id]/invitations')
  }
}

/**
 * GET /api/communities/[id]/invitations
 * Get all invitations for a community (owners/moderators/admins only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { searchParams } = new URL(request.url)

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    const status = searchParams.get('status') as 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | null

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      throw new APIError('Community not found', 404, 'NOT_FOUND')
    }

    // Check if user has permission to view invitations
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const canView =
      membership?.role === 'OWNER' ||
      membership?.role === 'MODERATOR' ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'

    if (!canView) {
      throw new APIError('Only community owners, moderators, or admins can view invitations', 403, 'FORBIDDEN')
    }

    // Build where clause
    const where: any = {
      communityId: id
    }

    if (status) {
      where.status = status
    }

    // Get invitations
    const invitations = await prisma.communityInvitation.findMany({
      where,
      include: {
        Inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        Invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      invitations
    })
  } catch (error) {
    return handleAPIError(error, 'GET /api/communities/[id]/invitations')
  }
}
