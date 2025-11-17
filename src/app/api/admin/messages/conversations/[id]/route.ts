import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireAdmin } from '@/lib/admin'
import { logAdminAction } from '@/lib/admin'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    requireAdmin(user.role as any)
    const { id } = await params

    // Delete the conversation (this will cascade delete messages and participants)
    await prisma.conversation.delete({
      where: {
        id,
      },
    })

    // Log admin action
    await logAdminAction({
      adminId: user.id,
      action: 'DELETE_CONVERSATION',
      targetType: 'Conversation',
      targetId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
