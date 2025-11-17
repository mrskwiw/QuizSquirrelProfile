import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isUserInConversation } from '@/lib/conversations'
import { getMessages } from '@/lib/messages'

// GET /api/messages/conversations/[id]/messages - Get messages in conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const conversationId = id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') || undefined

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Check if user is in conversation
    const isParticipant = await isUserInConversation(conversationId, user.id)
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      )
    }

    // Get messages
    const { messages, hasMore } = await getMessages(
      conversationId,
      user.id,
      limit,
      before
    )

    return NextResponse.json({ messages, hasMore })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
