import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { requireAuth, getCurrentUser } from '@/lib/auth'
import { validateUUID } from '@/lib/validation'
import { notifyQuizCreator, notifyCommentReply } from '@/lib/notifications'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/quiz/[id]/comments - Get all comments for a quiz
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid quiz ID format' },
        { status: 400 }
      )
    }

    const user = await getCurrentUser()

    // Use RLS-aware Prisma client
    const comments = await withUserContext(prismaRLS, user?.id, async (db) => {
      return await db.comment.findMany({
        where: {
          quizId: id,
          parentId: null, // Only get top-level comments
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
        orderBy: {
          createdAt: 'desc',
        },
      })
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/quiz/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid quiz ID format' },
        { status: 400 }
      )
    }

    const user = await requireAuth()
    const body = await request.json()

    // Validate request
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

    // Validate parentId UUID if provided
    if (body.parentId && !validateUUID(body.parentId)) {
      return NextResponse.json(
        { error: 'Invalid parent comment ID format' },
        { status: 400 }
      )
    }

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, user.id, async (db) => {
      // Check if quiz exists (RLS will filter to visible quizzes)
      const quiz = await db.quiz.findUnique({
        where: { id },
        select: { id: true },
      })

      if (!quiz) {
        throw new Error('Quiz not found')
      }

      // If parentId is provided, verify it exists
      if (body.parentId) {
        const parentComment = await db.comment.findUnique({
          where: { id: body.parentId },
        })

        if (!parentComment) {
          throw new Error('Parent comment not found')
        }
      }

      // Import sanitization at runtime to avoid circular dependencies
      const { sanitizeHTML } = await import('@/lib/validation')

      // Create comment with sanitized content
      const comment = await db.comment.create({
        data: {
          quizId: id,
          userId: user.id,
          content: sanitizeHTML(body.content.trim()),
          parentId: body.parentId || null,
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

      return {
        comment,
        shouldNotify: true,
        isReply: !!body.parentId,
        sanitizedContent: sanitizeHTML(body.content.trim()),
      }
    })

    // Send notifications outside transaction
    if (result.shouldNotify) {
      if (result.isReply) {
        // This is a reply - notify the parent comment author
        await notifyCommentReply(
          body.parentId,
          user.id,
          user.displayName,
          user.avatarUrl,
          result.sanitizedContent,
          id
        )
      } else {
        // This is a top-level comment - notify quiz creator
        await notifyQuizCreator(
          id,
          user.id,
          user.displayName,
          user.avatarUrl,
          'COMMENT',
          {
            commentText: result.sanitizedContent,
            commentId: result.comment.id,
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      comment: result.comment,
      message: 'Comment posted successfully',
    })
  } catch (error) {
    console.error('Comment creation error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to comment' },
          { status: 401 }
        )
      }
      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Parent comment not found') {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to post comment. Please try again.' },
      { status: 500 }
    )
  }
}
