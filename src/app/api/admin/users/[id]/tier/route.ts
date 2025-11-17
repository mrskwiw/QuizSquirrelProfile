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
    const { tier, reason } = await request.json()

    if (!tier || !['FREE', 'PRO', 'PREMIUM'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be FREE, PRO, or PREMIUM' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { id },
      select: { subscriptionTier: true, displayName: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update tier
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        subscriptionTier: tier,
      },
    })

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'USER_TIER_CHANGED',
      targetType: 'USER',
      targetId: id,
      oldValue: currentUser.subscriptionTier,
      newValue: tier,
      reason,
    })

    return NextResponse.json({
      message: 'User tier updated successfully',
      user: {
        id: updatedUser.id,
        subscriptionTier: updatedUser.subscriptionTier,
      },
    })
  } catch (error: any) {
    console.error('Admin tier update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user tier' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
