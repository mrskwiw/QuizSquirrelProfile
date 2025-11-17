import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// In-memory storage for typing indicators (expires after 3 seconds)
interface TypingIndicator {
  conversationId: string
  userId: string
  timestamp: number
}

const typingIndicators = new Map<string, TypingIndicator[]>()

// Clean up old typing indicators
function cleanupOldIndicators(conversationId: string) {
  const indicators = typingIndicators.get(conversationId) || []
  const now = Date.now()
  const active = indicators.filter(i => now - i.timestamp < 3000) // 3 seconds

  if (active.length > 0) {
    typingIndicators.set(conversationId, active)
  } else {
    typingIndicators.delete(conversationId)
  }
}

/**
 * POST /api/messages/typing
 * Send typing indicator
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Add typing indicator
    const indicators = typingIndicators.get(conversationId) || []
    const existing = indicators.findIndex(i => i.userId === user.id)

    if (existing >= 0) {
      // Update timestamp
      indicators[existing].timestamp = Date.now()
    } else {
      // Add new indicator
      indicators.push({
        conversationId,
        userId: user.id,
        timestamp: Date.now(),
      })
    }

    typingIndicators.set(conversationId, indicators)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting typing indicator:', error)
    return NextResponse.json(
      { error: 'Failed to set typing indicator' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/messages/typing?conversationId=xxx
 * Get typing indicators for a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Clean up old indicators first
    cleanupOldIndicators(conversationId)

    // Get active typing indicators (excluding current user)
    const indicators = typingIndicators.get(conversationId) || []
    const activeTyping = indicators
      .filter(i => i.userId !== user.id)
      .map(i => i.userId)

    return NextResponse.json({ typingUserIds: activeTyping })
  } catch (error) {
    console.error('Error getting typing indicators:', error)
    return NextResponse.json(
      { error: 'Failed to get typing indicators' },
      { status: 500 }
    )
  }
}
