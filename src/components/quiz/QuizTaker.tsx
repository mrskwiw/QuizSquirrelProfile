'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface QuizQuestion {
  id: string
  questionText: string
  questionType: 'MULTIPLE_CHOICE' | 'PERSONALITY' | 'POLL' | 'RATING'
  orderIndex: number
  options: QuizOption[]
}

interface QuizOption {
  id: string
  optionText: string
  orderIndex: number
}

interface QuizSettings {
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  allowRetakes: boolean
  showCorrectAnswers: boolean
  requireLogin: boolean
  timeLimit?: number
}

interface QuizTakerProps {
  quiz: {
    id: string
    title: string
    description?: string
    questions: QuizQuestion[]
    settings: QuizSettings
  }
}

interface UserAnswer {
  questionId: string
  optionId: string
  questionType: string
}

interface QuizResult {
  responseId: string
  score: number | null
  totalQuestions: number
  percentage: number | null
  showCorrectAnswers: boolean
  results: {
    questionId: string
    questionText: string
    selectedOptionId: string
    selectedOptionText: string
    correctOptionId?: string
    correctOptionText?: string
    isCorrect: boolean | null
  }[] | null
}

export function QuizTaker({ quiz }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // Initialize quiz (randomize if needed)
  useEffect(() => {
    let processedQuestions = [...quiz.questions]

    // Randomize questions if enabled
    if (quiz.settings.randomizeQuestions) {
      processedQuestions = shuffleArray(processedQuestions)
    }

    // Randomize answers within each question if enabled
    if (quiz.settings.randomizeAnswers) {
      processedQuestions = processedQuestions.map(q => ({
        ...q,
        options: shuffleArray([...q.options]),
      }))
    }

    setQuestions(processedQuestions)
  }, [quiz])

  // Timer logic
  useEffect(() => {
    if (quiz.settings.timeLimit && !isSubmitted) {
      setTimeRemaining(quiz.settings.timeLimit * 60) // Convert minutes to seconds

      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer)
            handleSubmit() // Auto-submit when time runs out
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.settings.timeLimit, isSubmitted])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId: string, optionId: string, questionType: string) => {
    setAnswers(prev => {
      const existing = prev.filter(a => a.questionId !== questionId)
      return [...existing, { questionId, optionId, questionType }]
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    // Submit to API
    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: answers.map(a => ({
            questionId: a.questionId,
            optionId: a.optionId,
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setQuizResult(data)
        setIsSubmitted(true)
      } else {
        console.error('Failed to submit quiz')
        alert('Failed to submit quiz. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    }
  }

  // Generate universal share message - ONE source of truth
  const generateShareMessage = () => {
    const scorePercentage = quizResult?.percentage ? Math.round(quizResult.percentage) : null
    const score = quizResult?.score ?? 0
    const total = quizResult?.totalQuestions ?? 0

    // Build rich context with emoji and performance messaging
    let performanceEmoji = '🎯'
    let performanceText = 'just completed'

    if (scorePercentage !== null) {
      if (scorePercentage >= 90) {
        performanceEmoji = '🏆'
        performanceText = 'aced'
      } else if (scorePercentage >= 80) {
        performanceEmoji = '⭐'
        performanceText = 'crushed'
      } else if (scorePercentage >= 70) {
        performanceEmoji = '✨'
        performanceText = 'did great on'
      } else if (scorePercentage >= 60) {
        performanceEmoji = '👍'
        performanceText = 'completed'
      } else {
        performanceEmoji = '🎯'
        performanceText = 'challenged myself with'
      }
    }

    // Universal message format
    const message = scorePercentage !== null
      ? `${performanceEmoji} I ${performanceText} "${quiz.title}" and scored ${scorePercentage}% (${score}/${total} correct)!\n\nThink you can beat my score? Take the quiz now!\n\n${window.location.href}`
      : `${performanceEmoji} I just completed "${quiz.title}" quiz!\n\nReady to test your knowledge? Take the quiz now!\n\n${window.location.href}`

    return message
  }

  const handleShare = async () => {
    const shareMessage = generateShareMessage()

    // Check if we're on mobile (where native share works better)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    // On mobile, try native share first
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ text: shareMessage })
        return // Success, no need to show prompt
      } catch (err: any) {
        // User cancelled or share failed, continue to show prompt
        if (err.name === 'AbortError') {
          return // User cancelled, don't show prompt
        }
      }
    }

    // Always show the prompt dialog with text selected for manual copy
    // Also try to copy to clipboard in the background
    copyToClipboardAndShowPrompt(shareMessage)
  }

  const copyToClipboardAndShowPrompt = (text: string) => {
    // Try to copy to clipboard in background (best effort, no alerts)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        // Silently fail, user has the prompt anyway
      })
    } else {
      // Try legacy copy method
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '0'
        textarea.style.width = '1px'
        textarea.style.height = '1px'
        textarea.style.padding = '0'
        textarea.style.border = 'none'
        textarea.style.outline = 'none'
        textarea.style.boxShadow = 'none'
        textarea.style.background = 'transparent'

        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (err) {
        // Silently fail
      }
    }

    // ALWAYS show the prompt with text for manual copy
    prompt('📋 Copy this text to share:\n\n(Select all with Ctrl+A, then copy with Ctrl+C)', text)
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading quiz...</p>
        </CardContent>
      </Card>
    )
  }

  if (isSubmitted && quizResult) {
    const scorePercentage = quizResult.percentage ? Math.round(quizResult.percentage) : null

    return (
      <div className="space-y-6">
        {/* Results Summary */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                scorePercentage !== null
                  ? scorePercentage >= 80
                    ? 'bg-green-100'
                    : scorePercentage >= 60
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
                  : 'bg-blue-100'
              }`}>
                {scorePercentage !== null ? (
                  <span className="text-3xl font-bold">{scorePercentage}%</span>
                ) : (
                  <span className="text-3xl">✓</span>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
              {quizResult.score !== null ? (
                <p className="text-xl text-gray-600">
                  You got {quizResult.score} out of {quizResult.totalQuestions} correct
                </p>
              ) : (
                <p className="text-xl text-gray-600">
                  You answered {answers.length} questions
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              {quiz.settings.allowRetakes && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false)
                    setQuizResult(null)
                    setCurrentQuestionIndex(0)
                    setAnswers([])
                    setTimeRemaining(quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : null)
                  }}
                >
                  Retake Quiz
                </Button>
              )}
              <Button variant="primary" onClick={handleShare}>
                📤 Share Results
              </Button>
            </div>

            {/* Share instruction hint */}
            <p className="text-sm text-gray-500 text-center mt-2">
              Click to copy your results and paste anywhere!
            </p>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        {quizResult.showCorrectAnswers && quizResult.results && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Review Your Answers</h3>
            {quizResult.results.map((result, index) => {
              const question = questions.find(q => q.id === result.questionId)
              if (!question) return null

              return (
                <Card key={result.questionId}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Badge variant="secondary">Q{index + 1}</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-lg mb-3">{result.questionText}</p>

                        {/* Your Answer */}
                        <div className={`p-3 rounded-lg mb-2 ${
                          result.isCorrect === true
                            ? 'bg-green-50 border border-green-200'
                            : result.isCorrect === false
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <p className="text-sm font-medium mb-1">Your Answer:</p>
                          <div className="flex items-center gap-2">
                            <span>{result.selectedOptionText}</span>
                            {result.isCorrect === true && <span className="text-green-600">✓</span>}
                            {result.isCorrect === false && <span className="text-red-600">✗</span>}
                          </div>
                        </div>

                        {/* Correct Answer (if wrong) */}
                        {result.isCorrect === false && result.correctOptionText && (
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                            <p className="text-sm font-medium mb-1 text-green-700">Correct Answer:</p>
                            <span className="text-green-900">{result.correctOptionText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          {timeRemaining !== null && (
            <Badge variant={timeRemaining < 60 ? 'danger' : 'default'}>
              ⏱ {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="p-8">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">
              {currentQuestion.questionType.replace('_', ' ')}
            </Badge>
            <h2 className="text-2xl font-bold mb-6">{currentQuestion.questionText}</h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(currentQuestion.id, option.id, currentQuestion.questionType)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  currentAnswer?.optionId === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${
                      currentAnswer?.optionId === option.id
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option.optionText}</span>
                  {currentAnswer?.optionId === option.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          ← Previous
        </Button>

        <div className="text-sm text-gray-500">
          {answers.length} / {questions.length} answered
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={answers.length === 0}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  )
}
