import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUnreadCount } from '@/lib/conversations'

// GET /api/messages/unread-count - Get total unread message count
export async function GET() {
  try {
    const user = await requireAuth()

    const count = await getUnreadCount(user.id)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}
