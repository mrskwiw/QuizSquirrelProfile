import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const user = await requireAuth()
    requireAdmin(user.role as any)

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get message statistics
    const [
      totalConversations,
      totalMessages,
      messagesLast24h,
      messagesLast7d,
      activeConversations,
    ] = await Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.message.count({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.conversation.count({
        where: {
          lastMessageAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
    ])

    // Get top users by message count
    const topUsers = await prisma.message.groupBy({
      by: ['senderId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    // Fetch user details for top users
    const userIds = topUsers.map((u) => u.senderId)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    })

    const topUsersWithDetails = topUsers.map((u) => {
      const user = users.find((user) => user.id === u.senderId)
      return {
        ...user,
        messageCount: u._count.id,
      }
    }).filter((u) => u.id) // Remove any users that weren't found

    return NextResponse.json({
      totalConversations,
      totalMessages,
      messagesLast24h,
      messagesLast7d,
      activeConversations,
      topUsers: topUsersWithDetails,
    })
  } catch (error) {
    console.error('Error fetching message stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
