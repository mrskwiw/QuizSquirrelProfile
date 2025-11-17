import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isUserInConversation } from '@/lib/conversations'
import { sendMessage } from '@/lib/messages'
import type { SendMessageRequest } from '@/types/messages'

// POST /api/messages - Send a new message
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = (await request.json()) as SendMessageRequest

    // Validate request
    if (!body.conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    if (!body.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Check if user is in conversation
    const isParticipant = await isUserInConversation(body.conversationId, user.id)
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      )
    }

    // Send message
    const message = await sendMessage(
      body.conversationId,
      user.id,
      body.content,
      body.contentType || 'text',
      body.metadata
    )

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
