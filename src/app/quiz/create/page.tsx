'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Spinner } from '@/components/ui/Spinner'

// Dynamic import for heavy QuizBuilder component (30-40% bundle size reduction)
const QuizBuilder = dynamic(() => import('@/components/quiz/QuizBuilder').then(mod => ({ default: mod.QuizBuilder })), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading quiz builder...</p>
      </div>
    </div>
  ),
  ssr: false
})

export default function CreateQuizPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      setIsAuthenticated(response.ok)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Create Quiz" />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                Login Required
              </h3>
              <p className="text-gray-500 mb-6">
                Please log in to create and publish quizzes.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/register')}
                >
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p className="mt-2 text-gray-600">
            Build your quiz step by step
          </p>
        </div>
        <QuizBuilder />
      </div>
    </div>
  )
}
