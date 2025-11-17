import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { requireAuth, getCurrentUser } from '@/lib/auth'
import { validateUUID, sanitizeHTML } from '@/lib/validation'

interface RouteParams {
  params: Promise<{
    commentId: string
  }>
}

// GET /api/comments/[commentId] - Get a single comment
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { commentId } = await params

    // Validate UUID format
    if (!validateUUID(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID format' },
        { status: 400 }
      )
    }

    const user = await getCurrentUser()

    // Use RLS-aware Prisma client
    const comment = await withUserContext(prismaRLS, user?.id, async (db) => {
      return await db.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isVerified: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
      })
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    )
  }
}

// PUT /api/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { commentId } = await params

    // Validate UUID format
    if (!validateUUID(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID format' },
        { status: 400 }
      )
    }

    const user = await requireAuth()
    const body = await request.json()

    // Validate content
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (body.content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Use RLS-aware Prisma client
    const updatedComment = await withUserContext(prismaRLS, user.id, async (db) => {
      // Check if comment exists and user owns it
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { userId: true },
      })

      if (!comment) {
        throw new Error('Comment not found')
      }

      if (comment.userId !== user.id) {
        throw new Error('Unauthorized')
      }

      // Update comment with sanitized content
      return await db.comment.update({
        where: { id: commentId },
        data: {
          content: sanitizeHTML(body.content.trim()),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      message: 'Comment updated successfully',
    })
  } catch (error) {
    console.error('Comment update error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You can only edit your own comments' },
          { status: 403 }
        )
      }
      if (error.message === 'Comment not found') {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update comment. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { commentId } = await params

    // Validate UUID format
    if (!validateUUID(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID format' },
        { status: 400 }
      )
    }

    const user = await requireAuth()

    // Use RLS-aware Prisma client
    await withUserContext(prismaRLS, user.id, async (db) => {
      // Check if comment exists and user owns it
      const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { userId: true },
      })

      if (!comment) {
        throw new Error('Comment not found')
      }

      if (comment.userId !== user.id) {
        throw new Error('Unauthorized')
      }

      // Delete comment (cascade will handle replies and likes)
      await db.comment.delete({
        where: { id: commentId },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error) {
    console.error('Comment deletion error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You can only delete your own comments' },
          { status: 403 }
        )
      }
      if (error.message === 'Comment not found') {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete comment. Please try again.' },
      { status: 500 }
    )
  }
}
