'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LikeButton } from '@/components/quiz/LikeButton'
import { Header } from '@/components/layout/Header'

interface Quiz {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  category: string
  createdAt: string
  creator: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
  }
  _count: {
    responses: number
    likes: number
    comments: number
  }
}

export default function NewQuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNewQuizzes()
  }, [])

  const fetchNewQuizzes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/quiz?sort=newest&limit=20')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error('Failed to fetch new quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading newest quizzes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="New Quizzes"
        showSearch={true}
        showNotifications={false}
        showCreateButton={false}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🆕 Newest Quizzes
          </h2>
          <p className="text-gray-600">
            Fresh content just uploaded to Quiz Squirrel
          </p>
        </div>

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No quizzes yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to create a quiz!
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/register')}
              >
                Sign Up to Create
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardContent className="p-6">
                  {/* Creator Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <a href={`/profile/${quiz.creator.username}`}>
                      <Avatar
                        src={quiz.creator.avatarUrl}
                        alt={quiz.creator.displayName}
                        fallback={quiz.creator.displayName}
                        size="sm"
                      />
                    </a>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/profile/${quiz.creator.username}`}
                          className="font-semibold hover:underline"
                        >
                          {quiz.creator.displayName}
                        </a>
                        {quiz.creator.isVerified && (
                          <Badge variant="success" className="text-xs">
                            ✓
                          </Badge>
                        )}
                        <span className="text-gray-600 text-sm">
                          created a quiz
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm">
                          {formatTimestamp(quiz.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quiz Card */}
                  <div
                    className="flex gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    onClick={() => router.push(`/quiz/${quiz.id}`)}
                  >
                    {/* Quiz Cover */}
                    {quiz.coverImage && (
                      <div className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={quiz.coverImage}
                          alt={quiz.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Quiz Info */}
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-2">
                        {quiz.category}
                      </Badge>
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {quiz.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{quiz._count.responses} plays</span>
                          <span>{quiz._count.comments} comments</span>
                        </div>
                        <LikeButton
                          quizId={quiz.id}
                          initialLikeCount={quiz._count.likes}
                          variant="compact"
                        />
                      </div>
                    </div>
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
