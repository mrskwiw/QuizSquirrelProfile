import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { validateUUID, sanitizeHTML } from '@/lib/validation'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/quiz/[id]/rating - Get rating statistics and user's rating
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
      // Batch all queries
      const [ratings, userRating] = await Promise.all([
        db.quizRating.findMany({
          where: { quizId: id },
          select: { rating: true },
        }),
        user
          ? db.quizRating.findUnique({
              where: {
                quizId_userId: {
                  quizId: id,
                  userId: user.id,
                },
              },
            })
          : null,
      ])

      const totalRatings = ratings.length
      const averageRating = totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0

      // Calculate rating distribution
      const distribution = {
        1: ratings.filter(r => r.rating === 1).length,
        2: ratings.filter(r => r.rating === 2).length,
        3: ratings.filter(r => r.rating === 3).length,
        4: ratings.filter(r => r.rating === 4).length,
        5: ratings.filter(r => r.rating === 5).length,
      }

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        distribution,
        userRating: userRating?.rating || null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}

// POST /api/quiz/[id]/rating - Submit or update a rating
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

    // Validate rating
    if (!body.rating || body.rating < 1 || body.rating > 5 || !Number.isInteger(body.rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
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

      // Upsert rating and get updated statistics
      const [rating, ratings] = await Promise.all([
        db.quizRating.upsert({
          where: {
            quizId_userId: {
              quizId: id,
              userId: user.id,
            },
          },
          update: {
            rating: body.rating,
            review: body.review ? sanitizeHTML(body.review) : null,
          },
          create: {
            quizId: id,
            userId: user.id,
            rating: body.rating,
            review: body.review ? sanitizeHTML(body.review) : null,
          },
        }),
        db.quizRating.findMany({
          where: { quizId: id },
          select: { rating: true },
        }),
      ])

      const totalRatings = ratings.length
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings

      return {
        success: true,
        rating: rating.rating,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        message: 'Rating submitted successfully',
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Rating submission error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to rate quizzes' },
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
      { error: 'Failed to submit rating. Please try again.' },
      { status: 500 }
    )
  }
}
