import { NextRequest, NextResponse } from 'next/server'
import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser, requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}
import { validateUUID, sanitizeInput, sanitizeHTML } from '@/lib/validation'

// GET /api/quiz/[id] - Fetch a single quiz by ID
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

    const currentUser = await getCurrentUser()

    // Use RLS-aware Prisma client
    const quiz = await withUserContext(prismaRLS, currentUser?.id, async (db) => {
      return await db.quiz.findUnique({
        where: {
          id: id,
        },
        include: {
          Question: {
            include: {
              QuestionOption: {
                orderBy: {
                  orderIndex: 'asc',
                },
              },
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              QuizLike: true,
              Comment: true,
              QuizResponse: true,
            },
          },
        },
      })
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

// PUT /api/quiz/[id] - Update an existing quiz
export async function PUT(
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

    // Validate required fields
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

    // Use RLS-aware Prisma client
    const result = await withUserContext(prismaRLS, user.id, async (db) => {
      // Check if quiz exists and user owns it (RLS will also enforce this)
      const existingQuiz = await db.quiz.findUnique({
        where: { id: id },
        select: { creatorId: true },
      })

      if (!existingQuiz) {
        throw new Error('Quiz not found')
      }

      if (existingQuiz.creatorId !== user.id) {
        throw new Error('Unauthorized')
      }

      // Delete existing questions and options, then recreate them
      await db.question.deleteMany({
        where: { quizId: id },
      })

      // Update quiz with sanitized data
      const updatedQuiz = await db.quiz.update({
        where: { id: id },
        data: {
          title: sanitizeInput(body.title.trim()),
          description: sanitizeHTML(body.description?.trim() || ''),
          coverImage: body.coverImage ? sanitizeInput(body.coverImage) : null,
          category: sanitizeInput(body.category),
          tags: body.tags?.map((tag: string) => sanitizeInput(tag)) || [],
          status: body.isDraft ? 'DRAFT' : 'PUBLISHED',
          settings: {
            randomizeQuestions: body.settings.randomizeQuestions,
            randomizeAnswers: body.settings.randomizeAnswers,
            allowRetakes: body.settings.allowRetakes,
            showCorrectAnswers: body.settings.showCorrectAnswers,
            requireLogin: body.settings.requireLogin,
            timeLimit: body.settings.timeLimit,
          },
          Question: {
            create: body.questions.map((question: any) => ({
              questionText: sanitizeHTML(question.questionText),
              questionType: question.questionType,
              orderIndex: question.orderIndex,
              QuestionOption: {
                create: question.options.map((option: any) => ({
                  optionText: sanitizeHTML(option.optionText),
                  orderIndex: option.orderIndex,
                  isCorrect: option.isCorrect || false,
                })),
              },
            })),
          },
        },
        include: {
          Question: {
            include: {
              QuestionOption: true,
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      })

      return updatedQuiz
    })

    return NextResponse.json({
      success: true,
      quiz: result,
      message: body.isDraft ? 'Quiz draft updated successfully' : 'Quiz updated and published successfully!',
    })

  } catch (error) {
    console.error('Quiz update error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to update a quiz' },
          { status: 401 }
        )
      }
      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this quiz' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update quiz. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE /api/quiz/[id] - Delete a quiz
export async function DELETE(
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
      // Check if quiz exists and user owns it (RLS will also enforce this)
      const existingQuiz = await db.quiz.findUnique({
        where: { id: id },
        select: { creatorId: true, title: true },
      })

      if (!existingQuiz) {
        throw new Error('Quiz not found')
      }

      if (existingQuiz.creatorId !== user.id) {
        throw new Error('Unauthorized to delete')
      }

      // Delete the quiz (cascade will handle questions and options)
      await db.quiz.delete({
        where: { id: id },
      })

      return { title: existingQuiz.title }
    })

    return NextResponse.json({
      success: true,
      message: `Quiz "${result.title}" deleted successfully`,
    })

  } catch (error) {
    console.error('Quiz deletion error:', error)

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You must be logged in to delete a quiz' },
          { status: 401 }
        )
      }
      if (error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Unauthorized to delete')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this quiz' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete quiz. Please try again.' },
      { status: 500 }
    )
  }
}
