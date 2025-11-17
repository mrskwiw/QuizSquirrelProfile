'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LikeButton } from '@/components/quiz/LikeButton'
import { Header } from '@/components/layout/Header'

interface Activity {
  type: 'QUIZ_CREATED' | 'QUIZ_TAKEN' | 'COMMENT'
  timestamp: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
  }
  quiz: {
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
  comment?: {
    id: string
    content: string
  }
}

export default function FeedPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
    fetchFeed()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      setIsAuthenticated(response.ok)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const fetchFeed = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/feed')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error)
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

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'QUIZ_CREATED':
        return 'created a new quiz'
      case 'QUIZ_TAKEN':
        return 'took a quiz'
      case 'COMMENT':
        return 'commented on'
      default:
        return 'activity'
    }
  }

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading feed...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Activity Feed" />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                Login Required
              </h3>
              <p className="text-gray-500 mb-6">
                Please log in to view your personalized activity feed and connect with the Quiz Squirrel community.
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
      <Header title="Activity Feed" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Feed */}
        {activities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No activity yet
              </h3>
              <p className="text-gray-500 mb-6">
                Follow other users to see their activity here!
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/')}
              >
                Explore Quizzes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <Card key={`${activity.type}-${activity.quiz.id}-${index}`}>
                <CardContent className="p-6">
                  {/* Activity Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <a href={`/profile/${activity.user.username}`}>
                      <Avatar
                        src={activity.user.avatarUrl}
                        alt={activity.user.displayName}
                        fallback={activity.user.displayName}
                        size="sm"
                      />
                    </a>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/profile/${activity.user.username}`}
                          className="font-semibold text-gray-900 hover:underline hover:text-blue-600"
                        >
                          {activity.user.displayName}
                        </a>
                        {activity.user.isVerified && (
                          <Badge variant="success" className="text-xs">
                            ✓
                          </Badge>
                        )}
                        <span className="text-gray-600 text-sm">
                          {getActivityText(activity)}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>

                      {/* Comment Content */}
                      {activity.type === 'COMMENT' && activity.comment && (
                        <p className="text-gray-700 text-sm mt-2 mb-3 bg-gray-50 p-3 rounded-md">
                          "{activity.comment.content}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quiz Card */}
                  <div
                    className="flex gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    onClick={() => router.push(`/quiz/${activity.quiz.id}`)}
                  >
                    {/* Quiz Cover */}
                    {activity.quiz.coverImage && (
                      <div className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={activity.quiz.coverImage}
                          alt={activity.quiz.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Quiz Info */}
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-2">
                        {activity.quiz.category}
                      </Badge>
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                        {activity.quiz.title}
                      </h3>
                      {activity.quiz.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {activity.quiz.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{activity.quiz._count.responses} plays</span>
                          <span>{activity.quiz._count.comments} comments</span>
                        </div>
                        <LikeButton
                          quizId={activity.quiz.id}
                          initialLikeCount={activity.quiz._count.likes}
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
