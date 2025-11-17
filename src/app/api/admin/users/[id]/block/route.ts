import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { requireAdmin, logAdminAction } from '@/lib/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth()
    requireAdmin(admin.role as any)

    const { id } = await params
    const { blocked, reason } = await request.json()

    if (typeof blocked !== 'boolean') {
      return NextResponse.json(
        { error: 'blocked field must be a boolean' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { id },
      select: { isBlocked: true, displayName: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent blocking other admins (optional safety check)
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot block admin users' },
        { status: 403 }
      )
    }

    // Update block status
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        isBlocked: blocked,
        blockedReason: blocked ? reason : null,
        blockedAt: blocked ? new Date() : null,
        blockedBy: blocked ? admin.id : null,
      },
    })

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      targetType: 'USER',
      targetId: id,
      oldValue: currentUser.isBlocked ? 'BLOCKED' : 'ACTIVE',
      newValue: blocked ? 'BLOCKED' : 'ACTIVE',
      reason,
    })

    return NextResponse.json({
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: updatedUser.id,
        isBlocked: updatedUser.isBlocked,
        blockedReason: updatedUser.blockedReason,
      },
    })
  } catch (error: any) {
    console.error('Admin block update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user block status' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
