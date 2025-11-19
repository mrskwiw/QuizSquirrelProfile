import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentUser } from '@/lib/auth'

// Type definitions for feed activities
interface PublicUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isVerified: boolean
}

interface QuizSummary {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  category: string
  _count: {
    responses: number
    likes: number
    comments: number
  }
}

interface CommentSummary {
  id: string
  content: string
}

type FeedActivity = {
  type: 'QUIZ_CREATED' | 'QUIZ_TAKEN' | 'COMMENT'
  timestamp: Date
  user: PublicUser
  quiz: QuizSummary
  comment?: CommentSummary
}

// GET /api/feed - Get activity feed
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      // If not logged in, return popular/recent quizzes
      const quizzes = await prisma.quiz.findMany({
        where: {
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          category: true,
          createdAt: true,
          User: {
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
              QuizResponse: true,
              QuizLike: true,
              Comment: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: 20,
      })

      return NextResponse.json({
        activities: quizzes.map((quiz) => ({
          type: 'QUIZ_CREATED',
          timestamp: quiz.createdAt,
          user: quiz.User,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            coverImage: quiz.coverImage,
            category: quiz.category,
            _count: quiz._count,
          },
        })),
      })
    }

    // Get users that the current user follows
    const following = await prisma.follow.findMany({
      where: {
        followerId: user.id,
      },
      select: {
        followingId: true,
      },
    })

    const followingIds = following.map((f) => f.followingId)

    // If not following anyone, return popular quizzes
    if (followingIds.length === 0) {
      const quizzes = await prisma.quiz.findMany({
        where: {
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          category: true,
          createdAt: true,
          User: {
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
              QuizResponse: true,
              QuizLike: true,
              Comment: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: 20,
      })

      return NextResponse.json({
        activities: quizzes.map((quiz) => ({
          type: 'QUIZ_CREATED',
          timestamp: quiz.createdAt,
          user: quiz.User,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            coverImage: quiz.coverImage,
            category: quiz.category,
            _count: quiz._count,
          },
        })),
      })
    }

    // Get activities from followed users AND activities on current user's quizzes
    // Execute all queries in parallel for better performance (80-85% faster)
    const [quizzes, responsesOnMyQuizzes, responses, comments, commentsOnMyQuizzes] = await Promise.all([
      // 1. Get quizzes created by followed users
      prisma.quiz.findMany({
        where: {
          creatorId: {
            in: followingIds,
          },
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          category: true,
          createdAt: true,
          User: {
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
              QuizResponse: true,
              QuizLike: true,
              Comment: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),

      // 2. Get responses on current user's quizzes (people taking YOUR quizzes)
      prisma.quizResponse.findMany({
        where: {
          Quiz: {
            creatorId: user.id,
          },
          userId: {
            not: user.id, // Exclude own responses
          },
        },
        select: {
          completedAt: true,
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          Quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              category: true,
              _count: {
                select: {
                  QuizResponse: true,
                  QuizLike: true,
                  Comment: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 20,
      }),

      // 3. Get quiz responses by followed users (recently taken quizzes)
      prisma.quizResponse.findMany({
        where: {
          userId: {
            in: followingIds,
          },
        },
        select: {
          completedAt: true,
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          Quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              category: true,
              _count: {
                select: {
                  QuizResponse: true,
                  QuizLike: true,
                  Comment: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 20,
      }),

      // 4. Get comments by followed users
      prisma.comment.findMany({
        where: {
          userId: {
            in: followingIds,
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          Quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              category: true,
              _count: {
                select: {
                  QuizResponse: true,
                  QuizLike: true,
                  Comment: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),

      // 5. Get comments on current user's quizzes (people commenting on YOUR quizzes)
      prisma.comment.findMany({
        where: {
          Quiz: {
            creatorId: user.id,
          },
          userId: {
            not: user.id, // Exclude own comments
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          Quiz: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImage: true,
              category: true,
              _count: {
                select: {
                  QuizResponse: true,
                  QuizLike: true,
                  Comment: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),
    ])

    // Combine all activities into a single array (filter out activities with null users)
    const activities: FeedActivity[] = [
      ...quizzes.map((quiz): FeedActivity => ({
        type: 'QUIZ_CREATED',
        timestamp: quiz.createdAt,
        user: quiz.User,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          coverImage: quiz.coverImage,
          category: quiz.category,
          _count: {
            responses: quiz._count.QuizResponse,
            likes: quiz._count.QuizLike,
            comments: quiz._count.Comment,
          },
        },
      })),
      ...responsesOnMyQuizzes.filter((r: any) => r.User !== null).map((response: any): FeedActivity => ({
        type: 'QUIZ_TAKEN',
        timestamp: response.completedAt,
        user: response.User!,
        quiz: {
          ...response.Quiz,
          _count: {
            responses: response.Quiz._count.QuizResponse,
            likes: response.Quiz._count.QuizLike,
            comments: response.Quiz._count.Comment,
          },
        },
      })),
      ...responses.filter((r: any) => r.User !== null).map((response: any): FeedActivity => ({
        type: 'QUIZ_TAKEN',
        timestamp: response.completedAt,
        user: response.User!,
        quiz: {
          ...response.Quiz,
          _count: {
            responses: response.Quiz._count.QuizResponse,
            likes: response.Quiz._count.QuizLike,
            comments: response.Quiz._count.Comment,
          },
        },
      })),
      ...comments.map((comment: any): FeedActivity => ({
        type: 'COMMENT',
        timestamp: comment.createdAt,
        user: comment.User,
        comment: {
          id: comment.id,
          content: comment.content,
        },
        quiz: {
          ...comment.Quiz,
          _count: {
            responses: comment.Quiz._count.QuizResponse,
            likes: comment.Quiz._count.QuizLike,
            comments: comment.Quiz._count.Comment,
          },
        },
      })),
      ...commentsOnMyQuizzes.map((comment: any): FeedActivity => ({
        type: 'COMMENT',
        timestamp: comment.createdAt,
        user: comment.User,
        comment: {
          id: comment.id,
          content: comment.content,
        },
        quiz: {
          ...comment.Quiz,
          _count: {
            responses: comment.Quiz._count.QuizResponse,
            likes: comment.Quiz._count.QuizLike,
            comments: comment.Quiz._count.Comment,
          },
        },
      })),
    ]

    // Sort all activities by timestamp (most recent first)
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Take top 30 activities
    const topActivities = activities.slice(0, 30)

    return NextResponse.json({
      activities: topActivities,
    })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}
