import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { requireAdmin, logAdminAction } from '@/lib/admin'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const user = await requireAuth()
    requireAdmin(user.role as any)

    const blockedEmails = await db.blockedEmail.findMany({
      include: {
        User: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        blockedAt: 'desc',
      },
    })

    return NextResponse.json({ blockedEmails })
  } catch (error: any) {
    console.error('Admin blocked emails fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blocked emails' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth()
    requireAdmin(admin.role as any)

    const { email, reason } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if already blocked
    const existing = await db.blockedEmail.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already blocked' },
        { status: 400 }
      )
    }

    const blockedEmail = await db.blockedEmail.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        reason,
        blockedBy: admin.id,
      },
    })

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'EMAIL_BLOCKED',
      targetType: 'EMAIL',
      targetId: blockedEmail.id,
      newValue: email,
      reason,
    })

    return NextResponse.json({
      message: 'Email blocked successfully',
      blockedEmail,
    })
  } catch (error: any) {
    console.error('Admin block email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to block email' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAuth()
    requireAdmin(admin.role as any)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      )
    }

    const blockedEmail = await db.blockedEmail.findUnique({
      where: { id },
    })

    if (!blockedEmail) {
      return NextResponse.json(
        { error: 'Blocked email not found' },
        { status: 404 }
      )
    }

    await db.blockedEmail.delete({
      where: { id },
    })

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'EMAIL_UNBLOCKED',
      targetType: 'EMAIL',
      targetId: id,
      oldValue: blockedEmail.email,
      reason: 'Unblocked email',
    })

    return NextResponse.json({
      message: 'Email unblocked successfully',
    })
  } catch (error: any) {
    console.error('Admin unblock email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unblock email' },
      { status: error.message === 'Unauthorized' || error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
