import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'

/**
 * GET /api/communities/[id]/activity
 * Get activity feed for a community (members only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const { searchParams } = new URL(request.url)

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const activityTypeParam = searchParams.get('activityType')
    const activityTypes = activityTypeParam
      ? activityTypeParam.split(',').filter(type =>
          ['MEMBER_JOINED', 'MEMBER_LEFT', 'QUIZ_POSTED', 'QUIZ_DELETED', 'ROLE_CHANGED', 'COMMUNITY_UPDATED'].includes(type)
        )
      : undefined

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      throw new APIError('Community not found', 404, 'NOT_FOUND')
    }

    // Check if user is a member (or if community is public)
    let isMember = false
    if (user) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: id
          }
        }
      })
      isMember = !!membership
    }

    // Only members can view activity feed for private communities
    if (!community.isPublic && !isMember) {
      throw new APIError('You must be a member to view this community activity', 403, 'FORBIDDEN')
    }

    // Build where clause
    const where: any = {
      communityId: id
    }

    if (activityTypes && activityTypes.length > 0) {
      where.activityType = {
        in: activityTypes
      }
    }

    // Get activity feed
    const [activities, total] = await Promise.all([
      prisma.communityActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
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
      }),
      prisma.communityActivity.count({ where })
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleAPIError(error, 'GET /api/communities/[id]/activity')
  }
}
