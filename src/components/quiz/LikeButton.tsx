'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface LikeButtonProps {
  quizId: string
  initialLiked?: boolean
  initialLikeCount?: number
  variant?: 'default' | 'compact'
}

export function LikeButton({
  quizId,
  initialLiked = false,
  initialLikeCount = 0,
  variant = 'default'
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch like status on mount
  useEffect(() => {
    fetchLikeStatus()
  }, [quizId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/like`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Failed to fetch like status:', error)
    }
  }

  const handleToggleLike = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/quiz/${quizId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()

        if (response.status === 401) {
          alert('Please log in to like quizzes')
          return
        }

        throw new Error(data.error || 'Failed to toggle like')
      }

      const data = await response.json()
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (error) {
      console.error('Error toggling like:', error)
      alert('Failed to update like. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleToggleLike()
        }}
        disabled={isLoading}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          liked
            ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } disabled:opacity-50`}
      >
        <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
        <span>{likeCount}</span>
      </button>
    )
  }

  return (
    <Button
      variant={liked ? 'primary' : 'outline'}
      onClick={handleToggleLike}
      isLoading={isLoading}
      className={liked ? 'bg-pink-600 hover:bg-pink-700' : ''}
    >
      <span className="mr-2">{liked ? '❤️' : '🤍'}</span>
      {liked ? 'Liked' : 'Like'} ({likeCount})
    </Button>
  )
}
