'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LikeButton } from '@/components/quiz/LikeButton'
import { Header } from '@/components/layout/Header'
import { SocialConnectionsSection } from '@/components/social/SocialConnectionsSection'
import { TumblrShare } from '@/components/social/TumblrShare'
import { FacebookShare } from '@/components/social/FacebookShare'

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  coverImage?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: string
  _count: {
    responses: number
    likes: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes()
    }
  }, [filter, isAuthenticated])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      setIsAuthenticated(response.ok)
      if (!response.ok) {
        setIsLoading(false)
      }
    } catch {
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  const fetchQuizzes = async () => {
    setIsLoading(true)
    try {
      const url = filter === 'ALL'
        ? '/api/quiz'
        : `/api/quiz?status=${filter}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes')
      }

      const data = await response.json()
      setQuizzes(data.quizzes || [])
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      alert('Failed to load your quizzes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuizzes = filter === 'ALL'
    ? quizzes
    : quizzes.filter(q => q.status === filter)

  const stats = {
    total: quizzes.length,
    drafts: quizzes.filter(q => q.status === 'DRAFT').length,
    published: quizzes.filter(q => q.status === 'PUBLISHED').length,
    totalTakes: quizzes.reduce((sum, q) => sum + q._count.responses, 0),
    totalLikes: quizzes.reduce((sum, q) => sum + q._count.likes, 0),
  }

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Dashboard" />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                Login Required
              </h3>
              <p className="text-gray-500 mb-6">
                Please log in to view your dashboard and manage your quizzes.
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
    <div className="min-h-screen bg-gray-50">
      <Header title="My Quizzes" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Quizzes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.drafts}</div>
              <div className="text-sm text-gray-600">Drafts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-600">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalTakes}</div>
              <div className="text-sm text-gray-600">Total Takes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-pink-600">{stats.totalLikes}</div>
              <div className="text-sm text-gray-600">Total Likes</div>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Connections */}
        <div className="mb-8">
          <SocialConnectionsSection compact />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Quizzes ({stats.total})
          </button>
          <button
            onClick={() => setFilter('DRAFT')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'DRAFT'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Drafts ({stats.drafts})
          </button>
          <button
            onClick={() => setFilter('PUBLISHED')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'PUBLISHED'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Published ({stats.published})
          </button>
        </div>

        {/* Quizzes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your quizzes...</div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filter === 'ALL' ? 'No quizzes yet' : `No ${filter.toLowerCase()} quizzes`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'ALL'
                  ? 'Create your first quiz to get started!'
                  : `You don't have any ${filter.toLowerCase()} quizzes yet.`}
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/quiz/create')}
              >
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Cover Image */}
                {quiz.coverImage && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={quiz.coverImage}
                      alt={quiz.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant={
                        quiz.status === 'PUBLISHED'
                          ? 'success'
                          : quiz.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {quiz.status}
                    </Badge>
                    <Badge variant="secondary">{quiz.category}</Badge>
                  </div>

                  {/* Quiz Title & Description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {quiz.description || 'No description'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">{quiz._count.responses}</span> takes
                      </div>
                    </div>
                    <LikeButton
                      quizId={quiz.id}
                      initialLikeCount={quiz._count.likes}
                      variant="compact"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {quiz.status === 'PUBLISHED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/quiz/${quiz.id}`)}
                          className="flex-1"
                        >
                          View
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/quiz/create?edit=${quiz.id}`)}
                          className="flex-1"
                        >
                          Continue Editing
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/quiz/create?edit=${quiz.id}`)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Create a copy of "${quiz.title}"?`)) {
                            try {
                              const response = await fetch(`/api/quiz/${quiz.id}`)
                              if (!response.ok) throw new Error('Failed to fetch quiz')

                              const data = await response.json()
                              const originalQuiz = data.quiz

                              // Navigate to create page with cloned data
                              const clonedData = {
                                title: `${originalQuiz.title} (Copy)`,
                                description: originalQuiz.description,
                                coverImage: originalQuiz.coverImage,
                                category: originalQuiz.category,
                                tags: originalQuiz.tags,
                                questions: originalQuiz.questions,
                                settings: originalQuiz.settings,
                              }

                              // Store in sessionStorage to pass to create page
                              sessionStorage.setItem('cloneQuizData', JSON.stringify(clonedData))
                              router.push('/quiz/create?clone=true')
                            } catch (error) {
                              console.error('Error duplicating quiz:', error)
                              alert('Failed to duplicate quiz. Please try again.')
                            }
                          }
                        }}
                        className="flex-1"
                      >
                        📋 Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`)) {
                            try {
                              const response = await fetch(`/api/quiz/${quiz.id}`, {
                                method: 'DELETE',
                              })

                              if (!response.ok) {
                                throw new Error('Failed to delete quiz')
                              }

                              const data = await response.json()
                              alert(data.message)
                              fetchQuizzes() // Refresh the list
                            } catch (error) {
                              console.error('Error deleting quiz:', error)
                              alert('Failed to delete quiz. Please try again.')
                            }
                          }
                        }}
                      >
                        🗑️
                      </Button>
                    </div>

                    {/* Quick Share to Social Media - Only for Published Quizzes */}
                    {quiz.status === 'PUBLISHED' && (
                      <div className="mt-2 space-y-2">
                        <TumblrShare
                          quizId={quiz.id}
                          variant="outline"
                          size="sm"
                          showSuccessMessage={true}
                        />
                        <FacebookShare
                          quizId={quiz.id}
                          variant="outline"
                          size="sm"
                          showSuccessMessage={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
