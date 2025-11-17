import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    requireAdmin(user.role as any)

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier') || ''
    const role = searchParams.get('role') || ''
    const blocked = searchParams.get('blocked') || ''

    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tier) {
      where.subscriptionTier = tier
    }

    if (role) {
      where.role = role
    }

    if (blocked === 'true') {
      where.isBlocked = true
    } else if (blocked === 'false') {
      where.isBlocked = false
    }

    // Get users
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        subscriptionTier: true,
        isBlocked: true,
        blockedReason: true,
        blockedAt: true,
        createdAt: true,
        _count: {
          select: {
            quizzes: true,
            responses: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    })

    // Get total count
    const total = await db.user.count({ where })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
