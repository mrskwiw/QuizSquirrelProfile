'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LikeButton } from '@/components/quiz/LikeButton'
import { Header } from '@/components/layout/Header'
import { SearchBar } from '@/components/search/SearchBar'

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  coverImage?: string
  tags: string[]
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

interface User {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isVerified: boolean
  bio: string | null
  _count: {
    quizzes: number
    followers: number
    following: number
  }
}

interface SearchResults {
  quizzes: Quiz[]
  users: User[]
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || 'all'
  const categoryParam = searchParams.get('category') || ''

  const [results, setResults] = useState<SearchResults>({ quizzes: [], users: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'quizzes' | 'users'>(typeParam as any || 'all')
  const [searchQuery, setSearchQuery] = useState(query)

  useEffect(() => {
    if (query || categoryParam) {
      performSearch(query, categoryParam)
    }
  }, [query, categoryParam])

  const performSearch = async (q: string, category?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category) params.set('category', category)
      params.set('type', 'all')

      const response = await fetch(`/api/search?${params.toString()}`)
      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const totalResults = results.quizzes.length + results.users.length
  const filteredQuizzes = activeTab === 'quizzes' || activeTab === 'all' ? results.quizzes : []
  const filteredUsers = activeTab === 'users' || activeTab === 'all' ? results.users : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Search Results" showSearch={false} />

      {/* Search Bar Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <SearchBar initialValue={searchQuery} autoFocus />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Header */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Search Results for "{query}"
            </h1>
            <p className="text-gray-600">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {categoryParam && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Category: {categoryParam}
            </h1>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({totalResults})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Quizzes ({results.quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Users ({results.users.length})
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Searching...</div>
          </div>
        ) : totalResults === 0 && (query || categoryParam) ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No results found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or browse by category
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quizzes Results */}
            {filteredQuizzes.length > 0 && (
              <div className="mb-8">
                {activeTab === 'all' && (
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Quizzes</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="secondary">{quiz.category}</Badge>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                          {quiz.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {quiz.description || 'No description'}
                        </p>

                        {/* Creator */}
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar
                            src={quiz.creator.avatarUrl || ''}
                            alt={quiz.creator.displayName}
                            fallback={quiz.creator.displayName}
                            size="sm"
                          />
                          <span className="text-sm text-gray-600">
                            by {quiz.creator.displayName}
                            {quiz.creator.isVerified && ' ✓'}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-semibold">{quiz._count.responses}</span> takes
                            </div>
                            <div>
                              <span className="font-semibold">{quiz._count.comments}</span> comments
                            </div>
                          </div>
                          <LikeButton
                            quizId={quiz.id}
                            initialLikeCount={quiz._count.likes}
                            variant="compact"
                          />
                        </div>

                        {/* Tags */}
                        {quiz.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {quiz.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/quiz/${quiz.id}`)}
                          className="w-full"
                        >
                          Take Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {filteredUsers.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Users</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar
                            src={user.avatarUrl || ''}
                            alt={user.displayName}
                            fallback={user.displayName}
                            size="lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {user.displayName}
                              {user.isVerified && ' ✓'}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        {user.bio && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {user.bio}
                          </p>
                        )}

                        <div className="flex gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-semibold">{user._count.quizzes}</span> quizzes
                          </div>
                          <div>
                            <span className="font-semibold">{user._count.followers}</span> followers
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="w-full"
                        >
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
