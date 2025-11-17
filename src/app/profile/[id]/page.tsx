'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LikeButton } from '@/components/quiz/LikeButton'
import { FollowButton } from '@/components/user/FollowButton'
import { BlockButton } from '@/components/user/BlockButton'

interface User {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  pronouns: string | null
  interests: string[]
  twitterHandle: string | null
  tumblrHandle: string | null
  instagramHandle: string | null
  tiktokHandle: string | null
  facebookHandle: string | null
  isVerified: boolean
  subscriptionTier: string
  createdAt: string
  isCurrentUser: boolean
  isFollowing: boolean
  _count: {
    quizzes: number
    responses: number
    followers: number
    following: number
  }
}

interface Quiz {
  id: string
  title: string
  description: string | null
  category: string
  coverImage: string | null
  createdAt: string
  _count: {
    responses: number
    likes: number
    comments: number
  }
}

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id: username } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
    fetchQuizzes()
  }, [username])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${username}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found')
          return
        }
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`/api/users/${username}/quizzes`)

      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes)
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'User not found'}
          </div>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar
                src={user.avatarUrl}
                alt={user.displayName}
                fallback={user.displayName}
                size="xl"
              />

              <div className="flex-1">
                {/* Name & Username */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.displayName}</h1>
                  {user.isVerified && (
                    <Badge variant="success">
                      ✓ Verified
                    </Badge>
                  )}
                  {user.subscriptionTier !== 'FREE' && (
                    <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      {user.subscriptionTier}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-lg mb-4">
                  @{user.username}
                  {user.pronouns && (
                    <span className="text-sm text-gray-500 ml-2">({user.pronouns})</span>
                  )}
                </p>

                {/* Bio */}
                {user.bio && (
                  <p className="text-gray-700 mb-4">{user.bio}</p>
                )}

                {/* Location & Website */}
                {(user.location || user.website) && (
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    {user.location && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>📍</span>
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>🔗</span>
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {user.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Social Media Handles */}
                {(user.twitterHandle || user.tumblrHandle || user.instagramHandle || user.tiktokHandle || user.facebookHandle) && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {user.twitterHandle && (
                      <a
                        href={`https://twitter.com/${user.twitterHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                      >
                        𝕏 @{user.twitterHandle}
                      </a>
                    )}
                    {user.tumblrHandle && (
                      <a
                        href={`https://${user.tumblrHandle}.tumblr.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        📱 {user.tumblrHandle}
                      </a>
                    )}
                    {user.instagramHandle && (
                      <a
                        href={`https://instagram.com/${user.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-600 hover:text-pink-700 hover:underline"
                      >
                        📷 @{user.instagramHandle}
                      </a>
                    )}
                    {user.tiktokHandle && (
                      <a
                        href={`https://tiktok.com/@${user.tiktokHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-900 hover:text-gray-700 hover:underline"
                      >
                        🎵 @{user.tiktokHandle}
                      </a>
                    )}
                    {user.facebookHandle && (
                      <a
                        href={`https://facebook.com/${user.facebookHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        👥 {user.facebookHandle}
                      </a>
                    )}
                  </div>
                )}

                {/* Interests */}
                {user.interests && user.interests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <span className="font-bold text-xl">{user._count.quizzes}</span>
                    <span className="text-gray-600 ml-1">Quizzes</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{user._count.responses}</span>
                    <span className="text-gray-600 ml-1">Taken</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{user._count.followers}</span>
                    <span className="text-gray-600 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{user._count.following}</span>
                    <span className="text-gray-600 ml-1">Following</span>
                  </div>
                </div>

                {/* Member Since */}
                <p className="text-sm text-gray-500">
                  Member since {formatDate(user.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  {user.isCurrentUser ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => router.push('/dashboard')}
                      >
                        My Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/profile/edit')}
                      >
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <FollowButton
                        username={user.username}
                        initialIsFollowing={user.isFollowing}
                        initialFollowerCount={user._count.followers}
                        onFollowChange={(isFollowing, followerCount) => {
                          setUser({
                            ...user,
                            isFollowing,
                            _count: {
                              ...user._count,
                              followers: followerCount,
                            },
                          })
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Create or get conversation with this user
                            const response = await fetch('/api/messages/conversations', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ userId: user.id }),
                            })

                            if (!response.ok) {
                              throw new Error('Failed to create conversation')
                            }

                            const { conversation } = await response.json()

                            // Navigate to the conversation
                            router.push(`/messages/${conversation.id}`)
                          } catch (error) {
                            console.error('Error opening conversation:', error)
                            alert('Failed to open conversation. Please try again.')
                          }
                        }}
                      >
                        Message
                      </Button>
                      <BlockButton
                        userId={user.id}
                        username={user.username}
                        variant="outline"
                        size="md"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quizzes Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Quizzes Created ({quizzes.length})
          </h2>

          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No quizzes yet
                </h3>
                <p className="text-gray-500">
                  {user.isCurrentUser
                    ? "You haven't created any quizzes yet."
                    : `${user.displayName} hasn't created any quizzes yet.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/quiz/${quiz.id}`)}
                >
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
                    {/* Category Badge */}
                    <Badge variant="secondary" className="mb-3">
                      {quiz.category}
                    </Badge>

                    {/* Quiz Title & Description */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {quiz.description || 'No description'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">{quiz._count.responses}</span> plays
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

                    {/* Created Date */}
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      {formatDate(quiz.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
