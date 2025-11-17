import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { validateUUID } from '@/lib/validation'
import { notifyQuizCreator } from '@/lib/notifications'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/quiz/[id]/like - Toggle like on a quiz
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

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, user.id, async (db) => {
      // Check if quiz exists (RLS will filter to visible quizzes only)
      const quiz = await db.quiz.findUnique({
        where: { id },
        select: { id: true, status: true },
      })

      if (!quiz) {
        throw new Error('Quiz not found')
      }

      // Check if already liked
      const existingLike = await db.quizLike.findUnique({
        where: {
          quizId_userId: {
            quizId: id,
            userId: user.id,
          },
        },
      })

      if (existingLike) {
        // Unlike - remove the like and get count
        const [, likeCount] = await Promise.all([
          db.quizLike.delete({
            where: {
              id: existingLike.id,
            },
          }),
          db.quizLike.count({
            where: { quizId: id },
          }),
        ])

        return {
          success: true,
          liked: false,
          likeCount,
          message: 'Quiz unliked',
          shouldNotify: false,
        }
      } else {
        // Like - create new like and get count
        const [, likeCount] = await Promise.all([
          db.quizLike.create({
            data: {
              quizId: id,
              userId: user.id,
            },
          }),
          db.quizLike.count({
            where: { quizId: id },
          }),
        ])

        return {
          success: true,
          liked: true,
          likeCount,
          message: 'Quiz liked',
          shouldNotify: true,
        }
      }
    })

    // Send notification outside of transaction if needed
    if (result.shouldNotify) {
      await notifyQuizCreator(
        id,
        user.id,
        user.displayName,
        user.avatarUrl,
        'QUIZ_LIKED'
      )
    }

    // Return result without shouldNotify flag
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { shouldNotify, ...response } = result
    return NextResponse.json(response)

  } catch (error) {
    console.error('Like toggle error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to like quizzes' },
          { status: 401 }
        )
      }
      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to toggle like. Please try again.' },
      { status: 500 }
    )
  }
}

// GET /api/quiz/[id]/like - Check if user has liked this quiz
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
    const result = await withUserContext(prismaRLS, user?.id, async (db) => {
      // Batch both queries
      const [like, likeCount] = await Promise.all([
        user
          ? db.quizLike.findUnique({
              where: {
                quizId_userId: {
                  quizId: id,
                  userId: user.id,
                },
              },
            })
          : Promise.resolve(null),
        db.quizLike.count({
          where: { quizId: id },
        }),
      ])

      return {
        liked: !!like,
        likeCount,
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Like check error:', error)

    // If not authenticated or error, return not liked with count
    try {
      const { id } = await params
      const likeCount = await withUserContext(prismaRLS, null, async (db) => {
        return await db.quizLike.count({
          where: { quizId: id },
        })
      })

      return NextResponse.json({
        liked: false,
        likeCount,
      })
    } catch {
      return NextResponse.json({
        liked: false,
        likeCount: 0,
      })
    }
  }
}
