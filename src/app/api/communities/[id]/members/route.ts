import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'

/**
 * GET /api/communities/[id]/members
 * Get all members of a community
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 }
      )
    }

    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Members list is only visible to community members
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to view community members' },
        { status: 401 }
      )
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to view the members list' },
        { status: 403 }
      )
    }

    const members = await prisma.communityMember.findMany({
      where: {
        communityId: id
      },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            role: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then MODERATOR, then MEMBER
        { joinedAt: 'asc' }
      ]
    })

    return NextResponse.json({
      members: members.map((member: any) => ({
        ...member.User,
        communityRole: member.role,
        joinedAt: member.joinedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching community members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/communities/[id]/members
 * Join a community (public) or add member (moderator/owner/admin)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, role } = body

    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // If no targetUserId is provided, user is joining themselves
    const userIdToAdd = targetUserId || user.id

    // Check if user is already a member
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: userIdToAdd,
          communityId: id
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this community' },
        { status: 409 }
      )
    }

    // Determine membership role
    let memberRole: 'MEMBER' | 'MODERATOR' = 'MEMBER'

    // If adding someone else or specifying a role, check permissions
    if (targetUserId || role) {
      const userMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: id
          }
        }
      })

      const canManageMembers =
        userMembership?.role === 'OWNER' ||
        userMembership?.role === 'MODERATOR' ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN'

      if (!canManageMembers) {
        return NextResponse.json(
          { error: 'You do not have permission to add members' },
          { status: 403 }
        )
      }

      // Validate role if specified
      if (role) {
        if (!['MEMBER', 'MODERATOR'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role. Only MEMBER or MODERATOR can be assigned' },
            { status: 400 }
          )
        }
        memberRole = role
      }
    } else {
      // User is joining themselves, check if community is public
      if (!community.isPublic) {
        return NextResponse.json(
          { error: 'This community is private. You need an invitation to join' },
          { status: 403 }
        )
      }
    }

    // Add the member
    const newMember = await prisma.communityMember.create({
      data: {
        userId: userIdToAdd,
        communityId: id,
        role: memberRole
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

    return NextResponse.json({
      success: true,
      member: newMember.User ? {
        ...newMember.User,
        communityRole: newMember.role,
        joinedAt: newMember.joinedAt
      } : null
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding community member:', error)
    return NextResponse.json(
      { error: 'Failed to add community member' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/communities/[id]/members
 * Leave a community or remove a member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 }
      )
    }

    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Determine who is being removed
    const userIdToRemove = targetUserId || user.id

    // Get user's membership
    const userMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    // If removing someone else, check permissions
    if (targetUserId && targetUserId !== user.id) {
      const canRemoveMembers =
        userMembership?.role === 'OWNER' ||
        userMembership?.role === 'MODERATOR' ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN'

      if (!canRemoveMembers) {
        return NextResponse.json(
          { error: 'You do not have permission to remove members' },
          { status: 403 }
        )
      }

      // Check if target exists
      const targetMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: userIdToRemove,
            communityId: id
          }
        }
      })

      if (!targetMembership) {
        return NextResponse.json(
          { error: 'User is not a member of this community' },
          { status: 404 }
        )
      }

      // Cannot remove the owner unless you're a super admin
      if (targetMembership.role === 'OWNER' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot remove the community owner' },
          { status: 403 }
        )
      }
    } else {
      // User is leaving, check if they're the owner
      if (userMembership?.role === 'OWNER') {
        // Count other members
        const memberCount = await prisma.communityMember.count({
          where: { communityId: id }
        })

        if (memberCount > 1) {
          return NextResponse.json(
            { error: 'Community owners cannot leave while there are other members. Transfer ownership or delete the community first.' },
            { status: 400 }
          )
        }
      }
    }

    // Remove the member
    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId: userIdToRemove,
          communityId: id
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: targetUserId ? 'Member removed successfully' : 'Left community successfully'
    })
  } catch (error) {
    console.error('Error removing community member:', error)
    return NextResponse.json(
      { error: 'Failed to remove community member' },
      { status: 500 }
    )
  }
}
