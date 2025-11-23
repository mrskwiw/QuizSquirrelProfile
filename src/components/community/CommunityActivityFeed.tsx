'use client'

import { useState, useEffect } from 'react'
import { CommunityActivity, CommunityActivityType } from '@/types/community'
import { ActivityItem } from './ActivityItem'
import { Button } from '@/components/ui/Button'

interface CommunityActivityFeedProps {
  communityId: string
  initialPage?: number
  initialLimit?: number
}

/**
 * Display community activity feed with pagination and filtering
 */
export function CommunityActivityFeed({
  communityId,
  initialPage = 1,
  initialLimit = 20
}: CommunityActivityFeedProps) {
  const [activities, setActivities] = useState<CommunityActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTypes, setSelectedTypes] = useState<CommunityActivityType[]>([])

  /**
   * Activity type filter options
   */
  const activityTypes: { value: CommunityActivityType; label: string }[] = [
    { value: 'MEMBER_JOINED', label: 'Joined' },
    { value: 'MEMBER_LEFT', label: 'Left' },
    { value: 'QUIZ_POSTED', label: 'Quiz Posted' },
    { value: 'QUIZ_DELETED', label: 'Quiz Deleted' },
    { value: 'ROLE_CHANGED', label: 'Role Changed' },
    { value: 'COMMUNITY_UPDATED', label: 'Updated' }
  ]

  /**
   * Fetch activities from API
   */
  const fetchActivities = async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (selectedTypes.length > 0) {
        params.append('activityType', selectedTypes.join(','))
      }

      const response = await fetch(
        `/api/communities/${communityId}/activity?${params.toString()}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity feed')
      }

      setActivities(data.activities || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggle activity type filter
   */
  const toggleActivityType = (type: CommunityActivityType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
    setPage(1) // Reset to first page when filter changes
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSelectedTypes([])
    setPage(1)
  }

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  /**
   * Fetch activities on mount and when dependencies change
   */
  useEffect(() => {
    fetchActivities()
  }, [communityId, page, selectedTypes])

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Error loading activity feed</p>
        <p className="text-sm mt-1">{error}</p>
        <Button
          onClick={fetchActivities}
          variant="outline"
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Activity Type Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Filter by activity type</h3>
          {selectedTypes.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {activityTypes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggleActivityType(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTypes.includes(value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {selectedTypes.length > 0
              ? 'No activities match the selected filters'
              : 'No activities yet'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(page - 1)}
              variant="outline"
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              onClick={() => handlePageChange(page + 1)}
              variant="outline"
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Loading indicator for page changes */}
      {isLoading && activities.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
