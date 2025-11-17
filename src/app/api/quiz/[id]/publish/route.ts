import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { requireAuth } from '@/lib/auth'
import { validateUUID } from '@/lib/validation'
import { canCreateQuiz } from '@/utils/featureGates'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

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

    // Check if user can publish (rate limiting check)
    const canCreate = await canCreateQuiz(user.id)
    if (!canCreate) {
      return NextResponse.json(
        {
          error: 'Daily quiz limit reached',
          message: 'You have reached your daily quiz creation limit. Please upgrade to publish this quiz.',
          requiresUpgrade: true,
        },
        { status: 403 }
      )
    }

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, user.id, async (db) => {
      // Find the quiz and verify ownership (RLS will also enforce)
      const quiz = await db.quiz.findUnique({
        where: { id },
        select: {
          id: true,
          creatorId: true,
          status: true,
        },
      })

      if (!quiz) {
        throw new Error('Quiz not found')
      }

      if (quiz.creatorId !== user.id) {
        throw new Error('Unauthorized')
      }

      if (quiz.status === 'PUBLISHED') {
        throw new Error('Already published')
      }

      // Publish the quiz and update user stats in one transaction
      const [publishedQuiz] = await Promise.all([
        db.quiz.update({
          where: { id },
          data: { status: 'PUBLISHED' },
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                orderIndex: 'asc',
              },
            },
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        }),
        // Update daily usage counter for Free tier users
        user.subscriptionTier === 'FREE'
          ? db.user.update({
              where: { id: user.id },
              data: {
                quizzesCreatedToday: {
                  increment: 1,
                },
                lastQuizCreatedAt: new Date(),
              },
            })
          : Promise.resolve(null),
      ])

      return publishedQuiz
    })

    return NextResponse.json({
      success: true,
      quiz: result,
      message: 'Quiz published successfully!',
    })

  } catch (error) {
    console.error('Quiz publish error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to publish a quiz' },
          { status: 401 }
        )
      }
      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You do not have permission to publish this quiz' },
          { status: 403 }
        )
      }
      if (error.message === 'Already published') {
        return NextResponse.json(
          { error: 'Quiz is already published' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to publish quiz. Please try again.' },
      { status: 500 }
    )
  }
}
