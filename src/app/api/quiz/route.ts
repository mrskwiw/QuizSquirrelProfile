import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { requireAuth } from '@/lib/auth'
import { sanitizeInput, sanitizeHTML } from '@/lib/validation'
import { canCreateQuiz, getQuizzesRemainingToday } from '@/utils/featureGates'

interface QuestionOption {
  optionText: string
  orderIndex: number
  isCorrect?: boolean
}

interface Question {
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'PERSONALITY' | 'POLL' | 'RATING'
  orderIndex: number
  options: QuestionOption[]
}

interface CreateQuizRequest {
  title: string
  description: string
  coverImage?: string
  category: string
  tags: string[]
  questions: Question[]
  settings: {
    randomizeQuestions: boolean
    randomizeAnswers: boolean
    allowRetakes: boolean
    showCorrectAnswers: boolean
    requireLogin: boolean
    timeLimit?: number
  }
  isDraft: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 API: POST /api/quiz - Request received')

    // Check authentication
    console.log('🔐 API: Checking authentication...')
    const user = await requireAuth()
    console.log('✅ API: User authenticated:', { userId: user.id, username: user.username })

    // Parse request body
    console.log('📥 API: Parsing request body...')
    const body: CreateQuizRequest = await request.json()
    console.log('📝 API: Request body parsed:', {
      title: body.title,
      category: body.category,
      questionCount: body.questions?.length,
      isDraft: body.isDraft
    })

    // Validate required fields
    console.log('✔️ API: Validating required fields...')
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Quiz title is required' },
        { status: 400 }
      )
    }

    if (!body.category || body.category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Quiz category is required' },
        { status: 400 }
      )
    }

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      )
    }

    // Validate that each question has at least 2 options
    for (let i = 0; i < body.questions.length; i++) {
      const question = body.questions[i]
      if (!question.options || question.options.length < 2) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least 2 options` },
          { status: 400 }
        )
      }
    }

    // Always save the quiz first (as draft if publishing but limit reached)
    // This preserves the user's work and enables upgrade flow
    let finalStatus: 'DRAFT' | 'PUBLISHED' = body.isDraft ? 'DRAFT' : 'PUBLISHED'
    let requiresUpgrade = false

    // Check daily quiz creation limit ONLY when trying to publish
    if (!body.isDraft) {
      console.log('🎯 API: Checking daily quiz creation limit...')
      const canCreate = await canCreateQuiz(user.id)
      console.log('📊 API: Can create quiz:', canCreate)
      if (!canCreate) {
        // Save as draft instead, but flag for upgrade prompt
        finalStatus = 'DRAFT'
        requiresUpgrade = true
        console.log('⚠️ API: Limit reached, saving as draft instead')
      }
    }

    // Create quiz with questions using RLS-aware client
    console.log('💾 API: Creating quiz in database...')
    const quiz = await withUserContext(prismaRLS, user.id, async (db) => {
      // Sanitize all user inputs
      const sanitizedQuizData = {
        title: sanitizeInput(body.title.trim()),
        description: sanitizeHTML(body.description?.trim() || ''),
        coverImage: body.coverImage ? sanitizeInput(body.coverImage) : undefined,
        category: sanitizeInput(body.category),
        tags: body.tags?.map((tag: string) => sanitizeInput(tag)) || [],
        status: finalStatus,
        creatorId: user.id,
        settings: {
          randomizeQuestions: body.settings.randomizeQuestions,
          randomizeAnswers: body.settings.randomizeAnswers,
          allowRetakes: body.settings.allowRetakes,
          showCorrectAnswers: body.settings.showCorrectAnswers,
          requireLogin: body.settings.requireLogin,
          timeLimit: body.settings.timeLimit,
        },
        questions: {
          create: body.questions.map((question) => ({
            questionText: sanitizeHTML(question.questionText),
            questionType: question.questionType,
            orderIndex: question.orderIndex,
            options: {
              create: question.options.map((option) => ({
                optionText: sanitizeHTML(option.optionText),
                orderIndex: option.orderIndex,
                isCorrect: option.isCorrect || false,
              })),
            },
          })),
        },
      }

      // Batch quiz creation and user stats update
      const [createdQuiz] = await Promise.all([
        db.quiz.create({
          data: sanitizedQuizData,
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
        // If successfully published, update user stats in same transaction
        finalStatus === 'PUBLISHED' && user.subscriptionTier === 'FREE'
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

      return createdQuiz
    })
    console.log('✅ API: Quiz created successfully:', { quizId: quiz.id, status: finalStatus })

    // Return different responses based on whether upgrade is required
    if (requiresUpgrade) {
      console.log('🔄 API: Returning upgrade required response')
      const remaining = await getQuizzesRemainingToday(user.id)
      return NextResponse.json({
        success: true,
        requiresUpgrade: true,
        quiz,
        message: 'Quiz saved as draft',
        upgradeMessage: `You've reached your daily limit of ${remaining} quizzes. Upgrade to Pro to publish unlimited quizzes!`,
        tier: user.subscriptionTier,
      })
    }

    console.log('🎉 API: Returning success response')
    return NextResponse.json({
      success: true,
      requiresUpgrade: false,
      quiz,
      message: body.isDraft ? 'Quiz draft saved successfully' : 'Quiz published successfully!',
    })

  } catch (error) {
    console.error('❌ API: Quiz creation error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to create a quiz' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create quiz. Please try again.' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch quizzes (public for browse, auth for user's own quizzes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') // 'newest', 'trending', or undefined for user's quizzes
    const timeframe = searchParams.get('timeframe') // 'day', 'week', 'month', 'all'
    const statusParam = searchParams.get('status') // 'DRAFT' or 'PUBLISHED'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Public browse queries (newest, trending)
    if (sort === 'newest' || sort === 'trending') {
      // No authentication required for public queries
      const result = await withUserContext(prismaRLS, null, async (db) => {
        if (sort === 'newest') {
          // Fetch newest published quizzes
          const [quizzes, total] = await Promise.all([
            db.quiz.findMany({
              where: {
                status: 'PUBLISHED',
              },
              include: {
                creator: {
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
                    responses: true,
                    likes: true,
                    comments: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: limit,
              skip: offset,
            }),
            db.quiz.count({
              where: { status: 'PUBLISHED' },
            }),
          ])

          return { quizzes, total, limit, offset }
        } else {
          // Fetch trending quizzes (most taken in the specified timeframe)
          const timeframeDate = new Date()
          switch (timeframe) {
            case 'day':
              timeframeDate.setDate(timeframeDate.getDate() - 1)
              break
            case 'week':
              timeframeDate.setDate(timeframeDate.getDate() - 7)
              break
            case 'month':
              timeframeDate.setMonth(timeframeDate.getMonth() - 1)
              break
            case 'all':
            default:
              // For 'all', set to a very old date (effectively no filter)
              timeframeDate.setFullYear(2000)
              break
          }

          // Get quizzes with response counts from the timeframe
          const quizzes = await db.quiz.findMany({
            where: {
              status: 'PUBLISHED',
              responses: {
                some: {
                  completedAt: {
                    gte: timeframeDate,
                  },
                },
              },
            },
            include: {
              creator: {
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
                  responses: true,
                  likes: true,
                  comments: true,
                },
              },
              responses: {
                where: {
                  completedAt: {
                    gte: timeframeDate,
                  },
                },
                select: {
                  id: true,
                },
              },
            },
            take: limit * 2, // Fetch more to sort properly
            skip: offset,
          })

          // Sort by response count in the timeframe
          const sortedQuizzes = quizzes
            .map((quiz) => ({
              ...quiz,
              recentResponseCount: quiz.responses.length,
            }))
            .sort((a, b) => b.recentResponseCount - a.recentResponseCount)
            .slice(0, limit) // Apply limit after sorting
            .map(({ responses, ...quiz }) => quiz) // Remove the responses array from response

          const total = await db.quiz.count({
            where: {
              status: 'PUBLISHED',
              responses: {
                some: {
                  completedAt: {
                    gte: timeframeDate,
                  },
                },
              },
            },
          })

          return { quizzes: sortedQuizzes, total, limit, offset }
        }
      })

      return NextResponse.json(result)
    }

    // User's own quizzes (requires authentication)
    const user = await requireAuth()

    const where: { creatorId: string; status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } = {
      creatorId: user.id,
      ...(statusParam && { status: statusParam as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }),
    }

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, user.id, async (db) => {
      // Batch quizzes query and count query
      const [quizzes, total] = await Promise.all([
        db.quiz.findMany({
          where,
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                orderIndex: 'asc',
              },
            },
            _count: {
              select: {
                responses: true,
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        db.quiz.count({ where }),
      ])

      return { quizzes, total, limit, offset }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Quiz fetch error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to view your quizzes' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}
