import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma'
import { QuizHeader } from '@/components/quiz/QuizHeader'
import { StarRating } from '@/components/quiz/StarRating'
import { Spinner } from '@/components/ui/Spinner'

// Dynamic imports for heavy components (20-30% bundle size reduction)
const QuizTaker = dynamic(
  () => import('@/components/quiz/QuizTaker').then(mod => ({ default: mod.QuizTaker })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }
)

const CommentsSection = dynamic(
  () => import('@/components/quiz/CommentsSection').then(mod => ({ default: mod.CommentsSection })),
  {
    loading: () => (
      <div className="py-4 text-center text-gray-600">
        Loading comments...
      </div>
    )
  }
)

interface QuizPageProps {
  params: Promise<{
    id: string
  }>
}

async function getQuiz(id: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
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
      questions: {
        include: {
          options: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          orderIndex: 'asc',
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
  })

  if (!quiz || quiz.status !== 'PUBLISHED') {
    return null
  }

  return quiz
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params
  const quiz = await getQuiz(id)

  if (!quiz) {
    notFound()
  }

  // Parse settings from JSON
  const settings = typeof quiz.settings === 'object' ? quiz.settings as {
    randomizeQuestions?: boolean
    randomizeAnswers?: boolean
    allowRetakes?: boolean
    showCorrectAnswers?: boolean
    requireLogin?: boolean
    timeLimit?: number
  } : {}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <QuizHeader quiz={quiz} />

        {/* Quiz Taker Component */}
        <QuizTaker
          quiz={{
            id: quiz.id,
            title: quiz.title,
            description: quiz.description || undefined,
            questions: quiz.questions.map(q => ({
              id: q.id,
              questionText: q.questionText,
              questionType: q.questionType,
              orderIndex: q.orderIndex,
              options: q.options.map(opt => ({
                id: opt.id,
                optionText: opt.optionText,
                orderIndex: opt.orderIndex,
              })),
            })),
            settings: {
              randomizeQuestions: settings.randomizeQuestions ?? false,
              randomizeAnswers: settings.randomizeAnswers ?? false,
              allowRetakes: settings.allowRetakes ?? true,
              showCorrectAnswers: settings.showCorrectAnswers ?? true,
              requireLogin: settings.requireLogin ?? false,
              timeLimit: settings.timeLimit,
            },
          }}
        />

        {/* Rating Section */}
        <div className="mt-6">
          <StarRating quizId={quiz.id} />
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <CommentsSection quizId={quiz.id} />
        </div>
      </div>
    </div>
  )
}
