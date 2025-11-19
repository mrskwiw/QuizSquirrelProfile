'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export interface SocialPost {
  id: string
  platform: 'TUMBLR' | 'FACEBOOK'
  externalUrl: string | null
  publishedAt: Date
  lastSyncedAt: Date | null
  likes: number
  shares: number
  comments: number
  views: number
  blogName?: string
}

export interface SocialMetricsProps {
  quizId: string
  className?: string
}

/**
 * SocialMetrics Component
 * Displays engagement statistics for social media posts
 */
export function SocialMetrics({ quizId, className }: SocialMetricsProps) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [quizId])

  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Note: This endpoint doesn't exist yet, we'll need to create it
      // For now, this is a placeholder for the UI
      const response = await fetch(`/api/quiz/${quizId}/social-posts`)

      if (!response.ok) {
        if (response.status === 404) {
          // No posts yet, that's okay
          setPosts([])
          return
        }
        throw new Error('Failed to fetch social media posts')
      }

      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err: any) {
      console.error('Fetch posts error:', err)
      // Don't show error if endpoint doesn't exist yet
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async (postId: string) => {
    setIsSyncing(postId)

    try {
      const response = await fetch(`/api/social/tumblr/posts/${postId}`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync metrics')
      }

      // Update the post in the list
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...data.metrics,
                lastSyncedAt: new Date(),
              }
            : post
        )
      )
    } catch (err: any) {
      console.error('Sync error:', err)
      alert(err.message || 'Failed to sync metrics')
    } finally {
      setIsSyncing(null)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const platformIcon = (platform: 'TUMBLR' | 'FACEBOOK') => {
    if (platform === 'TUMBLR') {
      return (
        <svg
          className="h-5 w-5 text-blue-600"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.178l.011.002z" />
        </svg>
      )
    }
    return (
      <svg
        className="h-5 w-5 text-blue-600"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Social Media Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Social Media Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            This quiz hasn&apos;t been shared on social media yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Social Media Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              {/* Platform Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {platformIcon(post.platform)}
                  <span className="font-medium text-gray-900">
                    {post.platform === 'TUMBLR' ? post.blogName : 'Facebook Page'}
                  </span>
                </div>
                {post.externalUrl && (
                  <a
                    href={post.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Post →
                  </a>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="mb-3 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(post.likes)}
                  </div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(post.shares)}
                  </div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(post.comments)}
                  </div>
                  <div className="text-xs text-gray-500">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(post.views)}
                  </div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500">
                  <div>Published: {formatDate(post.publishedAt)}</div>
                  <div>Last synced: {formatDate(post.lastSyncedAt)}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(post.id)}
                  isLoading={isSyncing === post.id}
                  disabled={isSyncing !== null}
                >
                  Sync
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
