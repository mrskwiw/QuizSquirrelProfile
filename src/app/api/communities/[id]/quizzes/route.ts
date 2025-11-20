import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateUUID } from '@/lib/validation'

/**
 * GET /api/communities/[id]/quizzes
 * Get quizzes posted to a community (member-only access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const { searchParams } = new URL(request.url)

    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 }
      )
    }

    // Get community
    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check membership requirement
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to view community content' },
        { status: 401 }
      )
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to view this community feed' },
        { status: 403 }
      )
    }

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get quizzes from this community only
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: {
          communityId: id,
          status: 'PUBLISHED'
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              QuizResponse: true,
              QuizLike: true,
              Comment: true
            }
          }
        }
      }),
      prisma.quiz.count({
        where: {
          communityId: id,
          status: 'PUBLISHED'
        }
      })
    ])

    // Check if user has liked each quiz
    const quizIds = quizzes.map(q => q.id)
    const userLikes = await prisma.quizLike.findMany({
      where: {
        userId: user.id,
        quizId: {
          in: quizIds
        }
      }
    })

    const likedQuizIds = new Set(userLikes.map(like => like.quizId))

    const quizzesWithLikes = quizzes.map(quiz => ({
      ...quiz,
      responseCount: quiz._count.QuizResponse,
      likeCount: quiz._count.QuizLike,
      commentCount: quiz._count.Comment,
      isLiked: likedQuizIds.has(quiz.id)
    }))

    return NextResponse.json({
      quizzes: quizzesWithLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching community quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community quizzes' },
      { status: 500 }
    )
  }
}
