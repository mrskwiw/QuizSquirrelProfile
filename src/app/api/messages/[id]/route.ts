import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { editMessage, deleteMessage } from '@/lib/messages'

/**
 * PATCH /api/messages/:id
 * Edit a message
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const message = await editMessage(id, user.id, content)

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error editing message:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('15 minutes')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/messages/:id
 * Delete a message (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    await deleteMessage(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
