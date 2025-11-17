import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { addReaction, removeReaction } from '@/lib/message-reactions'

/**
 * POST /api/messages/:id/reactions
 * Add a reaction to a message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { emoji } = await request.json()

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      )
    }

    const reaction = await addReaction(id, user.id, emoji)

    return NextResponse.json(reaction)
  } catch (error) {
    console.error('Error adding reaction:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/messages/:id/reactions
 * Remove a reaction from a message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const emoji = searchParams.get('emoji')

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji parameter is required' },
        { status: 400 }
      )
    }

    await removeReaction(id, user.id, emoji)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing reaction:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    )
  }
}
