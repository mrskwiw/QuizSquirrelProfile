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
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action') || ''
    const adminId = searchParams.get('adminId') || ''

    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (action) {
      where.action = action
    }

    if (adminId) {
      where.adminId = adminId
    }

    // Get audit logs
    const logs = await db.auditLog.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            displayName: true,
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
    const total = await db.auditLog.count({ where })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Admin audit logs fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
