'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CommunityCard from '@/components/community/CommunityCard'
import CreateCommunityModal from '@/components/community/CreateCommunityModal'

interface Community {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPublic: boolean
  memberCount: number
  quizCount: number
  User: {
    username: string
    displayName: string
    avatarUrl: string | null
    role: string
  }
  userRole?: string | null
  isMember?: boolean
}

export default function CommunitiesPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [searchQuery, showPublicOnly, page])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/current')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }

  const fetchCommunities = async () => {
    if (page === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (showPublicOnly) {
        params.append('isPublic', 'true')
      }

      const response = await fetch(`/api/communities?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch communities')
      }

      if (page === 1) {
        setCommunities(data.communities)
      } else {
        setCommunities(prev => [...prev, ...data.communities])
      }

      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCommunities()
  }

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      setPage(prev => prev + 1)
    }
  }

  const canCreateCommunity = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
              <p className="text-gray-600 mt-1">
                Join communities and share quizzes with like-minded people
              </p>
            </div>
            {canCreateCommunity && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Community</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search communities..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="publicOnly"
                checked={showPublicOnly}
                onChange={(e) => {
                  setShowPublicOnly(e.target.checked)
                  setPage(1)
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="publicOnly" className="text-sm text-gray-700">
                Public only
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Be the first to create a community!'}
            </p>
          </div>
        ) : (
          <>
            {/* Communities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
