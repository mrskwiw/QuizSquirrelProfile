import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser } from '@/lib/auth'
import { sanitizeInput } from '@/lib/validation'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}

// GET /api/users/[username]/quizzes - Get user's published quizzes
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { username: rawUsername } = await params

    // Sanitize username parameter
    const username = sanitizeInput(rawUsername)

    // Get current user (optional authentication)
    const currentUser = await getCurrentUser()

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, currentUser?.id, async (db) => {
      // Batch user lookup and quizzes query
      const user = await db.user.findUnique({
        where: { username },
        select: { id: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Get published quizzes
      const quizzes = await db.quiz.findMany({
        where: {
          creatorId: user.id,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          coverImage: true,
          createdAt: true,
          _count: {
            select: {
              QuizResponse: true,
              QuizLike: true,
              Comment: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return { quizzes }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching user quizzes:', error)

    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}
