import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser } from '@/lib/auth'
import { validateUUID } from '@/lib/validation'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/quiz/[id]/social-posts
 *
 * Fetch all social media posts and their engagement metrics for a quiz.
 * Only returns data if the requesting user is the quiz creator.
 *
 * @returns Array of social media posts with metrics
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: quizId } = await params

    // Validate UUID format
    if (!validateUUID(quizId)) {
      return NextResponse.json(
        { error: 'Invalid quiz ID format' },
        { status: 400 }
      )
    }

    // Get current user (optional - metrics may be viewable by anyone in the future)
    const user = await getCurrentUser()

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, user?.id, async (db) => {
      // First check if quiz exists and get creator
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          creatorId: true,
          status: true,
        },
      })

      if (!quiz) {
        throw new Error('Quiz not found')
      }

      // For now, only allow quiz creator to view metrics
      // TODO: Consider making metrics public for published quizzes to encourage sharing
      if (user?.id !== quiz.creatorId) {
        return { posts: [] }
      }

      // Fetch all social media posts for this quiz with connection details
      const posts = await db.socialMediaPost.findMany({
        where: {
          quizId,
        },
        include: {
          connection: {
            select: {
              platform: true,
              tumblrBlogName: true,
              facebookPageName: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
      })

      // Format posts for frontend
      const formattedPosts = posts.map((post) => ({
        id: post.id,
        platform: post.platform,
        externalUrl: post.externalUrl,
        publishedAt: post.publishedAt,
        lastSyncedAt: post.lastSyncedAt,
        likes: post.likes,
        shares: post.shares,
        comments: post.comments,
        views: post.views,
        blogName: post.connection.tumblrBlogName || post.connection.facebookPageName || undefined,
      }))

      return {
        posts: formattedPosts,
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Social posts fetch error:', error)

    if (error instanceof Error) {
      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch social media posts' },
      { status: 500 }
    )
  }
}
