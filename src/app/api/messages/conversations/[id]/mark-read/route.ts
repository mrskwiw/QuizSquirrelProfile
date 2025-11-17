import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isUserInConversation, markConversationAsRead } from '@/lib/conversations'

// POST /api/messages/conversations/[id]/mark-read - Mark conversation as read
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const conversationId = id

    // Check if user is in conversation
    const isParticipant = await isUserInConversation(conversationId, user.id)
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      )
    }

    await markConversationAsRead(conversationId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking conversation as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark as read' },
      { status: 500 }
    )
  }
}
