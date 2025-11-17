import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  getConversation,
  isUserInConversation,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
  deleteConversationForUser,
} from '@/lib/conversations'

// GET /api/messages/conversations/[id] - Get conversation details
export async function GET(
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

    const conversation = await getConversation(conversationId, user.id)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// PATCH /api/messages/conversations/[id] - Update conversation settings
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const conversationId = id
    const body = await request.json()

    // Check if user is in conversation
    const isParticipant = await isUserInConversation(conversationId, user.id)
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      )
    }

    // Handle different actions
    if (body.action === 'archive') {
      await archiveConversation(conversationId, user.id)
    } else if (body.action === 'unarchive') {
      await unarchiveConversation(conversationId, user.id)
    } else if (body.action === 'mute') {
      await muteConversation(conversationId, user.id)
    } else if (body.action === 'unmute') {
      await unmuteConversation(conversationId, user.id)
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/messages/conversations/[id] - Delete conversation for user
export async function DELETE(
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

    await deleteConversationForUser(conversationId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
