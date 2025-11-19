import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const user = await requireAuth()
    requireAdmin(user.role as any)

    // Get user counts by tier
    const userCounts = await db.user.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    })

    // Get total users
    const totalUsers = await db.user.count()

    // Get users created today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await db.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    })

    // Get total quizzes
    const totalQuizzes = await db.quiz.count()

    // Get published quizzes
    const publishedQuizzes = await db.quiz.count({
      where: {
        status: 'PUBLISHED',
      },
    })

    // Get total quiz responses
    const totalResponses = await db.quizResponse.count()

    // Get blocked users count
    const blockedUsers = await db.user.count({
      where: {
        isBlocked: true,
      },
    })

    // Get blocked emails count
    const blockedEmails = await db.blockedEmail.count()

    // Get recent admin actions (last 10)
    const recentActions = await db.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        User: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    })

    // Calculate revenue this month (mock - would be real with payment integration)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const proUsersThisMonth = await db.user.count({
      where: {
        subscriptionTier: 'PRO',
        updatedAt: {
          gte: monthStart,
        },
      },
    })

    const premiumUsersThisMonth = await db.user.count({
      where: {
        subscriptionTier: 'PREMIUM',
        updatedAt: {
          gte: monthStart,
        },
      },
    })

    const estimatedRevenue = (proUsersThisMonth * 9.99) + (premiumUsersThisMonth * 29.99)

    return NextResponse.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        byTier: userCounts.reduce((acc, item) => {
          acc[item.subscriptionTier] = item._count
          return acc
        }, {} as Record<string, number>),
        blocked: blockedUsers,
      },
      quizzes: {
        total: totalQuizzes,
        published: publishedQuizzes,
        draft: totalQuizzes - publishedQuizzes,
      },
      QuizResponse: {
        total: totalResponses,
      },
      blocked: {
        users: blockedUsers,
        emails: blockedEmails,
      },
      revenue: {
        thisMonth: estimatedRevenue,
        proSubscribers: proUsersThisMonth,
        premiumSubscribers: premiumUsersThisMonth,
      },
      recentActions,
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
