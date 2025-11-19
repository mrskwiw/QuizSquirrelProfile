import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyQuizCreator } from '@/lib/notifications'
import { validateUUID } from '@/lib/validation'

interface SubmitQuizRequest {
  quizId: string
  Answer: {
    questionId: string
    optionId: string
  }[]
}

export async function POST(request: NextRequest) {
  try {
    // Get current user (optional - guests can take quizzes)
    const user = await getCurrentUser()

    const body: SubmitQuizRequest = await request.json()

    // Validate request
    if (!body.quizId || !body.Answer || body.Answer.length === 0) {
      return NextResponse.json(
        { error: 'Quiz ID and answers are required' },
        { status: 400 }
      )
    }

    // Validate quiz ID format
    if (!validateUUID(body.quizId)) {
      return NextResponse.json(
        { error: 'Invalid quiz ID format' },
        { status: 400 }
      )
    }

    // Get quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: body.quizId },
      include: {
        Question: {
          include: {
            QuestionOption: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if login is required
    if (quiz.requireLogin && !user) {
      return NextResponse.json(
        { error: 'You must be logged in to take this quiz' },
        { status: 401 }
      )
    }

    // Validate all answers before processing
    // Build valid question and option ID sets
    const validQuestionIds = new Set(quiz.Question.map((q: any) => q.id))
    const validOptionIds = new Set<string>()
    const questionToOptionsMap = new Map<string, Set<string>>()

    quiz.Question.forEach((question: any) => {
      const optionIds = question.QuestionOption.map((o: any) => o.id)
      optionIds.forEach((id: string) => validOptionIds.add(id))
      questionToOptionsMap.set(question.id, new Set(optionIds))
    })

    // Validate each answer
    for (const answer of body.Answer) {
      // Validate question ID exists in quiz
      if (!validQuestionIds.has(answer.questionId)) {
        return NextResponse.json(
          { error: `Invalid question ID: ${answer.questionId}` },
          { status: 400 }
        )
      }

      // Validate option ID exists in quiz
      if (!validOptionIds.has(answer.optionId)) {
        return NextResponse.json(
          { error: `Invalid option ID: ${answer.optionId}` },
          { status: 400 }
        )
      }

      // Validate option belongs to the question
      const questionOptions = questionToOptionsMap.get(answer.questionId)
      if (!questionOptions || !questionOptions.has(answer.optionId)) {
        return NextResponse.json(
          { error: `Option ${answer.optionId} does not belong to question ${answer.questionId}` },
          { status: 400 }
        )
      }
    }

    // Calculate score for multiple choice quizzes
    let score = 0
    let totalPossible = 0
    const results = body.Answer.map((answer: any) => {
      const question = quiz.Question.find((q: any) => q.id === answer.questionId)
      if (!question) return null

      const selectedOption = question.QuestionOption.find((o: any) => o.id === answer.optionId)
      const correctOption = question.QuestionOption.find((o: any) => o.isCorrect)

      if (question.questionType === 'MULTIPLE_CHOICE' && correctOption) {
        totalPossible++
        const isCorrect = selectedOption?.isCorrect || false
        if (isCorrect) score++

        return {
          questionId: question.id,
          questionText: question.questionText,
          selectedOptionId: answer.optionId,
          selectedOptionText: selectedOption?.optionText || '',
          correctOptionId: correctOption.id,
          correctOptionText: correctOption.optionText,
          isCorrect,
        }
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        selectedOptionId: answer.optionId,
        selectedOptionText: selectedOption?.optionText || '',
        isCorrect: null, // Not applicable for non-MC questions
      }
    }).filter(Boolean)

    // Create quiz response record
    const response = await prisma.quizResponse.create({
      data: {
        quizId: body.quizId,
        userId: user?.id,
        score: totalPossible > 0 ? Math.round((score / totalPossible) * 100) : null,
        completedAt: new Date(),
        Answer: {
          create: body.Answer.map((a: any) => ({
            questionId: a.questionId,
            selectedOptionId: a.optionId,
          })),
        },
      },
    })

    // Send notification to quiz creator (if user is logged in)
    if (user) {
      await notifyQuizCreator(
        body.quizId,
        user.id,
        user.displayName,
        user.avatarUrl,
        'QUIZ_TAKEN'
      )
    }

    // Return results
    return NextResponse.json({
      success: true,
      responseId: response.id,
      score: totalPossible > 0 ? score : null,
      totalQuestions: totalPossible > 0 ? totalPossible : quiz.Question.length,
      percentage: response.score,
      showCorrectAnswers: quiz.showCorrectAnswers,
      results: quiz.showCorrectAnswers ? results : null,
    })

  } catch (error) {
    console.error('Quiz submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz. Please try again.' },
      { status: 500 }
    )
  }
}
