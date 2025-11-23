import { Prisma } from '@prisma/client'

/**
 * Log community activity helper
 * This function logs various community activities for the activity feed
 */
export async function logCommunityActivity(
  tx: Prisma.TransactionClient,
  data: {
    communityId: string
    userId: string
    activityType: 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'QUIZ_POSTED' | 'QUIZ_DELETED' | 'ROLE_CHANGED' | 'COMMUNITY_UPDATED'
    metadata?: Record<string, any>
  }
) {
  return await tx.communityActivity.create({
    data: {
      communityId: data.communityId,
      userId: data.userId,
      activityType: data.activityType,
      metadata: data.metadata || {}
    }
  })
}

/**
 * Get community activity feed
 * Fetches recent activity for a community with user and metadata details
 */
export async function getCommunityActivityFeed(
  tx: Prisma.TransactionClient,
  communityId: string,
  options: {
    limit?: number
    offset?: number
    activityTypes?: Array<'MEMBER_JOINED' | 'MEMBER_LEFT' | 'QUIZ_POSTED' | 'QUIZ_DELETED' | 'ROLE_CHANGED' | 'COMMUNITY_UPDATED'>
  } = {}
) {
  const { limit = 20, offset = 0, activityTypes } = options

  const where: any = {
    communityId
  }

  if (activityTypes && activityTypes.length > 0) {
    where.activityType = {
      in: activityTypes
    }
  }

  const activities = await tx.communityActivity.findMany({
    where,
    take: limit,
    skip: offset,
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
  })

  return activities
}

/**
 * Clean up old community activity
 * Removes activity older than a specified number of days (default 90)
 */
export async function cleanupOldCommunityActivity(
  tx: Prisma.TransactionClient,
  daysToKeep: number = 90
) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  return await tx.communityActivity.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  })
}
