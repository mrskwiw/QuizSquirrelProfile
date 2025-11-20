'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Member {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  communityRole: string
  joinedAt: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  category: string
  tags: string[]
  createdAt: string
  User: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  responseCount: number
  likeCount: number
  commentCount: number
  isLiked: boolean
}

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string

  const [community, setCommunity] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [quizPage, setQuizPage] = useState(1)
  const [hasMoreQuizzes, setHasMoreQuizzes] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
    fetchCommunity()
  }, [communityId])

  useEffect(() => {
    if (community?.isMember && activeTab === 'feed') {
      fetchQuizzes()
    } else if (community?.isMember && activeTab === 'members') {
      fetchMembers()
    }
  }, [activeTab, community?.isMember, quizPage])

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

  const fetchCommunity = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/communities/${communityId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch community')
      }

      setCommunity(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true)
    try {
      const response = await fetch(`/api/communities/${communityId}/quizzes?page=${quizPage}&limit=10`)
      const data = await response.json()

      if (response.ok) {
        if (quizPage === 1) {
          setQuizzes(data.quizzes)
        } else {
          setQuizzes(prev => [...prev, ...data.quizzes])
        }
        setHasMoreQuizzes(quizPage < data.pagination.totalPages)
      } else {
        // If not a member, show appropriate message
        if (response.status === 403 || response.status === 401) {
          setQuizzes([])
        }
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    } finally {
      setIsLoadingQuizzes(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/members`)
      const data = await response.json()

      if (response.ok) {
        setMembers(data.members)
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join community')
      }

      await fetchCommunity()
      if (activeTab === 'feed') {
        await fetchQuizzes()
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this community?')) {
      return
    }

    setIsLeaving(true)
    try {
      const response = await fetch(`/api/communities/${communityId}/members`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave community')
      }

      await fetchCommunity()
      setQuizzes([])
      setMembers([])
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setIsLeaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/communities')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Communities
          </button>
        </div>
      </div>
    )
  }

  if (!community) {
    return null
  }

  const canManage = community.userRole === 'OWNER' || community.userRole === 'MODERATOR' ||
    currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
        {community.coverImage && (
          <Image
            src={community.coverImage}
            alt={community.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
                {!community.isPublic && (
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>Private</span>
                  </span>
                )}
              </div>

              {community.description && (
                <p className="text-gray-600 mb-4">{community.description}</p>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>{community.memberCount} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{community.quizCount} quizzes</span>
                </div>
                <div className="text-gray-400">•</div>
                <div>
                  Created by{' '}
                  <Link
                    href={`/profile/${community.User.username}`}
                    className="text-blue-600 hover:underline"
                  >
                    {community.User.displayName}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {currentUser && !community.isMember && community.isPublic && (
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? 'Joining...' : 'Join Community'}
                </button>
              )}

              {community.isMember && community.userRole !== 'OWNER' && (
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLeaving ? 'Leaving...' : 'Leave Community'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Member-only Content */}
        {community.isMember ? (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'feed'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Feed
                  </button>
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'members'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Members ({community.memberCount})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Feed Tab */}
                {activeTab === 'feed' && (
                  <div>
                    {isLoadingQuizzes && quizPage === 1 ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : quizzes.length === 0 ? (
                      <div className="text-center py-12">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
                        <p className="text-gray-600">
                          Be the first to share a quiz in this community!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {quizzes.map((quiz) => (
                            <Link
                              key={quiz.id}
                              href={`/quiz/${quiz.id}`}
                              className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start space-x-4">
                                {quiz.coverImage && (
                                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                    <Image
                                      src={quiz.coverImage}
                                      alt={quiz.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {quiz.title}
                                  </h3>
                                  {quiz.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                      {quiz.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>{quiz.User.displayName}</span>
                                    <span>•</span>
                                    <span>{quiz.responseCount} responses</span>
                                    <span>•</span>
                                    <span>{quiz.likeCount} likes</span>
                                    <span>•</span>
                                    <span>{quiz.commentCount} comments</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {hasMoreQuizzes && (
                          <div className="text-center mt-6">
                            <button
                              onClick={() => setQuizPage(prev => prev + 1)}
                              disabled={isLoadingQuizzes}
                              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              {isLoadingQuizzes ? 'Loading...' : 'Load More'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <Link
                        key={member.id}
                        href={`/profile/${member.username}`}
                        className="flex items-center space-x-3 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <div className="relative w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                          {member.avatarUrl ? (
                            <Image
                              src={member.avatarUrl}
                              alt={member.displayName}
                              fill
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-lg">
                              {member.displayName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 truncate">
                            {member.displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.communityRole === 'OWNER' && '👑 Owner'}
                            {member.communityRole === 'MODERATOR' && '🛡️ Moderator'}
                            {member.communityRole === 'MEMBER' && 'Member'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Non-member view */
          <div className="bg-white rounded-lg shadow p-8 text-center">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Members Only
            </h3>
            <p className="text-gray-600 mb-6">
              Join this community to view quizzes and members.
            </p>
            {currentUser && community.isPublic && (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join Community'}
              </button>
            )}
            {!currentUser && (
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Log In to Join
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
