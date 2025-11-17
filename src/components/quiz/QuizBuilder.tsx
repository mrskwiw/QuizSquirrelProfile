'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuizInfoForm } from './QuizInfoForm'
import { QuestionBuilder } from './QuestionBuilder'
import { QuizSettingsForm } from './QuizSettingsForm'
import { QuizPreview } from './QuizPreview'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type QuizStep = 'info' | 'questions' | 'settings' | 'preview'

export interface QuizData {
  title: string
  description: string
  coverImage?: string
  category: string
  tags: string[]
  questions: Question[]
  settings: QuizSettings
}

export interface Question {
  id: string
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'PERSONALITY' | 'POLL' | 'RATING'
  imageUrl?: string
  orderIndex: number
  options: QuestionOption[]
  personalityOutcomes?: Record<string, number>
}

export interface QuestionOption {
  id: string
  optionText: string
  imageUrl?: string
  isCorrect?: boolean
  points?: number
  orderIndex: number
  personalityWeight?: Record<string, number>
}

export interface QuizSettings {
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  timeLimit?: number
  allowRetakes: boolean
  showCorrectAnswers: boolean
  requireLogin: boolean
}

const defaultQuizData: QuizData = {
  title: '',
  description: '',
  category: '',
  tags: [],
  questions: [],
  settings: {
    randomizeQuestions: false,
    randomizeAnswers: false,
    allowRetakes: true,
    showCorrectAnswers: true,
    requireLogin: false,
  },
}

export function QuizBuilder() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<QuizStep>('info')
  const [quizData, setQuizData] = useState<QuizData>(defaultQuizData)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizzesRemaining, setQuizzesRemaining] = useState<number | null>(null)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  // Load quiz data if editing or cloning
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const editId = searchParams.get('edit')
    const isClone = searchParams.get('clone')

    if (editId) {
      setEditingQuizId(editId)
      loadQuizData(editId)
    } else if (isClone === 'true') {
      // Load cloned data from sessionStorage
      const clonedDataStr = sessionStorage.getItem('cloneQuizData')
      if (clonedDataStr) {
        try {
          const clonedData = JSON.parse(clonedDataStr)
          setQuizData(clonedData)
          sessionStorage.removeItem('cloneQuizData') // Clean up
        } catch (error) {
          console.error('Failed to load cloned quiz data:', error)
          setError('Failed to load quiz data for cloning')
        }
      }
    }
  }, [])

  const loadQuizData = async (quizId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}`)

      if (!response.ok) {
        throw new Error('Failed to load quiz')
      }

      const data = await response.json()
      const quiz = data.quiz

      // Transform quiz data to match QuizData interface
      setQuizData({
        title: quiz.title,
        description: quiz.description || '',
        coverImage: quiz.coverImage,
        category: quiz.category,
        tags: quiz.tags || [],
        questions: quiz.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          orderIndex: q.orderIndex,
          options: q.options.map((opt: any) => ({
            id: opt.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            orderIndex: opt.orderIndex,
          })),
        })),
        settings: quiz.settings || defaultQuizData.settings,
      })
    } catch (err) {
      console.error('Error loading quiz:', err)
      setError('Failed to load quiz. Redirecting...')
      setTimeout(() => router.push('/dashboard'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch quiz limit on mount
  useEffect(() => {
    const fetchLimit = async () => {
      try {
        const response = await fetch('/api/quiz/limit')
        if (response.ok) {
          const data = await response.json()
          setQuizzesRemaining(data.unlimited ? null : data.remaining)
        }
      } catch (err) {
        console.error('Failed to fetch quiz limit:', err)
      }
    }
    fetchLimit()
  }, [])

  const steps: { id: QuizStep; label: string; completed: boolean }[] = [
    { id: 'info', label: 'Quiz Info', completed: !!quizData.title },
    { id: 'questions', label: 'Questions', completed: quizData.questions.length > 0 },
    { id: 'settings', label: 'Settings', completed: true },
    { id: 'preview', label: 'Preview', completed: false },
  ]

  const saveQuiz = async (isDraft: boolean) => {
    setIsSaving(true)
    setError(null)

    try {
      console.log('🚀 Starting quiz save...', { isDraft })
      console.log('📝 Quiz data:', {
        title: quizData.title,
        category: quizData.category,
        questionCount: quizData.questions.length,
        questions: quizData.questions.map(q => ({
          text: q.questionText,
          type: q.questionType,
          optionCount: q.options.length
        }))
      })

      const url = editingQuizId ? `/api/quiz/${editingQuizId}` : '/api/quiz'
      const method = editingQuizId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quizData.title,
          description: quizData.description,
          coverImage: quizData.coverImage,
          category: quizData.category,
          tags: quizData.tags,
          questions: quizData.questions.map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            orderIndex: q.orderIndex,
            options: q.options.map(opt => ({
              optionText: opt.optionText,
              orderIndex: opt.orderIndex,
              isCorrect: opt.isCorrect,
            })),
          })),
          settings: quizData.settings,
          isDraft,
        }),
      })

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      console.log('📄 Content-Type:', contentType)

      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Non-JSON response received')
        throw new Error('Database not connected. Please set up your local PostgreSQL database first. See LOCAL_DATABASE_SETUP.md for instructions.')
      }

      const data = await response.json()
      console.log('✅ Parsed JSON data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save quiz')
      }

      // Check if upgrade is required
      if (data.requiresUpgrade) {
        // Quiz was saved as draft, redirect to upgrade page
        const upgradeUrl = `/upgrade?quizId=${data.quiz.id}&message=${encodeURIComponent(data.upgradeMessage)}`
        router.push(upgradeUrl)
        return
      }

      // Show success message
      if (editingQuizId) {
        alert(isDraft ? 'Quiz draft updated successfully!' : 'Quiz updated and published successfully!')
        router.push('/dashboard')
      } else {
        if (isDraft) {
          alert('Draft saved successfully!')
        } else {
          alert('Quiz published successfully!')
          // Redirect to the quiz page or dashboard
          router.push(`/quiz/${data.quiz.id}`)
        }
      }

    } catch (err) {
      console.error('Error saving quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to save quiz')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = () => saveQuiz(true)
  const handlePublish = () => saveQuiz(false)

  const canProceed = () => {
    switch (currentStep) {
      case 'info':
        return quizData.title && quizData.category
      case 'questions':
        // Must have at least 1 question and each question must have at least 2 options
        return quizData.questions.length > 0 &&
               quizData.questions.every(q => q.options.length >= 2)
      case 'settings':
        return true
      default:
        return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading quiz...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 ${
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed ? '✓' : index + 1}
                </div>
                <span className="font-medium hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Daily Limit Badge (for Free tier) */}
      <div className="flex justify-between items-center">
        <Badge variant="secondary">Draft</Badge>
        {quizzesRemaining !== null && (
          <Badge variant="warning">
            {quizzesRemaining} quiz{quizzesRemaining !== 1 ? 'es' : ''} remaining today
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 'info' && (
          <QuizInfoForm
            data={quizData}
            onChange={(data) => setQuizData({ ...quizData, ...data })}
          />
        )}

        {currentStep === 'questions' && (
          <QuestionBuilder
            questions={quizData.questions}
            onChange={(questions) => setQuizData({ ...quizData, questions })}
          />
        )}

        {currentStep === 'settings' && (
          <QuizSettingsForm
            settings={quizData.settings}
            onChange={(settings) => setQuizData({ ...quizData, settings })}
          />
        )}

        {currentStep === 'preview' && (
          <QuizPreview quiz={quizData} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow p-6">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep)
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id)
            }
          }}
          disabled={currentStep === 'info'}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            isLoading={isSaving}
          >
            Save Draft
          </Button>

          {currentStep === 'preview' ? (
            <Button
              variant="primary"
              onClick={handlePublish}
              isLoading={isSaving}
            >
              Publish Quiz
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep)
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id)
                }
              }}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
