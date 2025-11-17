'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface StarRatingProps {
  quizId: string
}

export function StarRating({ quizId }: StarRatingProps) {
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchRatings()
  }, [quizId])

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}/rating`)
      if (response.ok) {
        const data = await response.json()
        setAverageRating(data.averageRating)
        setTotalRatings(data.totalRatings)
        setUserRating(data.userRating)
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
    }
  }

  const handleRatingClick = async (rating: number) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/quiz/${quizId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          alert('Please log in to rate this quiz')
          return
        }
        throw new Error(data.error || 'Failed to submit rating')
      }

      const data = await response.json()
      setUserRating(data.rating)
      setAverageRating(data.averageRating)
      setTotalRatings(data.totalRatings)
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStar = (index: number, size: 'sm' | 'lg' = 'lg') => {
    const rating = hoverRating || userRating || 0
    const isFilled = index <= rating
    const sizeClass = size === 'sm' ? 'text-lg' : 'text-3xl'

    return (
      <button
        key={index}
        onMouseEnter={() => setHoverRating(index)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => handleRatingClick(index)}
        disabled={isSubmitting}
        className={`${sizeClass} transition-all hover:scale-110 disabled:opacity-50`}
      >
        {isFilled ? '⭐' : '☆'}
      </button>
    )
  }

  const renderAverageStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(averageRating)
      stars.push(
        <span key={i} className="text-yellow-400">
          {isFilled ? '⭐' : '☆'}
        </span>
      )
    }
    return stars
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Rate this Quiz</h2>

        {/* Average Rating Display */}
        {totalRatings > 0 && (
          <div className="mb-6 text-center">
            <div className="flex justify-center items-center gap-1 mb-2">
              {renderAverageStars()}
            </div>
            <div className="text-gray-600">
              <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-sm ml-2">
                ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          </div>
        )}

        {/* User Rating Input */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            {userRating ? 'Your rating:' : 'Click to rate:'}
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
          </div>
          {userRating && (
            <p className="text-xs text-gray-500 mt-2">
              Click a different star to update your rating
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
