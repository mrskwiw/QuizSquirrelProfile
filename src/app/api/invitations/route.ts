import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleAPIError } from '@/lib/error-handler'

/**
 * GET /api/invitations
 * Get all community invitations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | null

    // Build where clause
    const where: any = {
      inviteeId: user.id
    }

    if (status) {
      where.status = status
    } else {
      // By default, only show pending invitations
      where.status = 'PENDING'
      where.expiresAt = {
        gt: new Date()
      }
    }

    // Get invitations
    const invitations = await prisma.communityInvitation.findMany({
      where,
      include: {
        Community: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true,
            isPublic: true,
            _count: {
              select: {
                CommunityMember: true
              }
            }
          }
        },
        Inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform response to include memberCount
    const transformedInvitations = invitations.map(invitation => ({
      ...invitation,
      Community: {
        ...invitation.Community,
        memberCount: (invitation.Community as any)._count.CommunityMember
      }
    }))

    return NextResponse.json({
      invitations: transformedInvitations
    })
  } catch (error) {
    return handleAPIError(error, 'GET /api/invitations')
  }
}
