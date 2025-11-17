import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getNewMessages } from '@/lib/messages'

// GET /api/messages/poll - Poll for new messages
export async function GET(request: Request) {
  try {
    const user = await requireAuth()

    // Get since parameter from query
    const { searchParams } = new URL(request.url)
    const sinceParam = searchParams.get('since')

    if (!sinceParam) {
      return NextResponse.json(
        { error: 'since parameter is required' },
        { status: 400 }
      )
    }

    const since = new Date(sinceParam)

    if (isNaN(since.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for since parameter' },
        { status: 400 }
      )
    }

    // Get new messages
    const newMessages = await getNewMessages(user.id, since)

    // Get unique conversation IDs that have new messages
    const updatedConversations = [...new Set(newMessages.map((m) => m.conversationId))]

    return NextResponse.json({
      newMessages,
      updatedConversations,
    })
  } catch (error) {
    console.error('Error polling messages:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to poll messages' },
      { status: 500 }
    )
  }
}
