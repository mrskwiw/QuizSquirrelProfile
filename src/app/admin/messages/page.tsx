'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface MessageStats {
  totalConversations: number
  totalMessages: number
  messagesLast24h: number
  messagesLast7d: number
  activeConversations: number
  topUsers: Array<{
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    messageCount: number
  }>
}

interface RecentConversation {
  id: string
  participants: Array<{
    user: {
      id: string
      username: string
      displayName: string
      avatarUrl: string | null
    }
  }>
  lastMessageAt: Date
  messageCount: number
  lastMessage?: {
    content: string
    createdAt: Date
    sender: {
      username: string
    }
  }
}

export default function AdminMessagesPage() {
  const router = useRouter()
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [conversations, setConversations] = useState<RecentConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, conversationsRes] = await Promise.all([
        fetch('/api/admin/messages/stats'),
        fetch('/api/admin/messages/conversations'),
      ])

      if (!statsRes.ok || !conversationsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const statsData = await statsRes.json()
      const conversationsData = await conversationsRes.json()

      setStats(statsData)
      setConversations(conversationsData.conversations)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load messaging data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/messages/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      alert('Conversation deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert('Failed to delete conversation')
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading messaging data...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Failed to load messaging data</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages Management</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
              </div>
              <div className="text-4xl">✉️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Last 24 Hours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.messagesLast24h}</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeConversations}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Users */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Active Users</h2>
            <div className="space-y-3">
              {stats.topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-semibold w-6">{index + 1}.</span>
                    <Avatar
                      src={user.avatarUrl || ''}
                      alt={user.displayName}
                      fallback={user.displayName}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {user.messageCount} messages
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Messages (Last 24h)</span>
                <span className="font-semibold">{stats.messagesLast24h}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Messages (Last 7d)</span>
                <span className="font-semibold">{stats.messagesLast7d}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Avg per conversation</span>
                <span className="font-semibold">
                  {stats.totalConversations > 0
                    ? Math.round(stats.totalMessages / stats.totalConversations)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-gray-500">No conversations found</p>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => {
                const participants = conversation.participants
                  .map((p) => p.user.displayName)
                  .join(' & ')

                return (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex -space-x-2">
                        {conversation.participants.slice(0, 2).map((p) => (
                          <Avatar
                            key={p.user.id}
                            src={p.user.avatarUrl || ''}
                            alt={p.user.displayName}
                            fallback={p.user.displayName}
                            size="sm"
                            className="ring-2 ring-white"
                          />
                        ))}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{participants}</p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-500 truncate max-w-md">
                            {conversation.lastMessage.sender.username}:{' '}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.messageCount} messages • Last active{' '}
                          {formatDate(conversation.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/messages/${conversation.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
