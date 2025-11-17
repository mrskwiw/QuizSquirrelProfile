import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUserConversations, getOrCreateConversation } from '@/lib/conversations'
import { validateUserId } from '@/lib/message-validation'
import type { CreateConversationRequest } from '@/types/messages'

// GET /api/messages/conversations - List all conversations
export async function GET() {
  try {
    const user = await requireAuth()

    const conversations = await getUserConversations(user.id)

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/messages/conversations - Create new conversation
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = (await request.json()) as CreateConversationRequest

    if (!body.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate the other user ID
    validateUserId(body.userId)

    // Check if user is trying to message themselves
    if (body.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      )
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(user.id, body.userId)

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
