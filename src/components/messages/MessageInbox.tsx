'use client'

import { useState, useMemo } from 'react'
import { useConversations } from '@/hooks/useConversations'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { ConversationListItem } from '@/types/messages'

export function MessageInbox() {
  const { conversations, loading, error } = useConversations()
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // Filter conversations by search query and archive status
  const filteredConversations = useMemo(() => {
    // First filter by archive status
    let filtered = conversations.filter(conv => conv.isArchived === showArchived)

    // Then apply search query
    if (!searchQuery.trim()) return filtered

    const query = searchQuery.toLowerCase()
    return filtered.filter(conv => {
      const usernameMatch = conv.otherUser.username.toLowerCase().includes(query)
      const displayNameMatch = conv.otherUser.displayName.toLowerCase().includes(query)
      const messageMatch = conv.lastMessage?.content.toLowerCase().includes(query)

      return usernameMatch || displayNameMatch || messageMatch
    })
  }, [conversations, searchQuery, showArchived])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load conversations</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading conversations...</div>
      </div>
    )
  }

  if (conversations.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No messages yet</h2>
        <p className="text-gray-600 mb-4">
          Start a conversation by visiting a user&apos;s profile and clicking &quot;Send Message&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-600">No conversations found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))
        )}
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: ConversationListItem
}

function ConversationItem({ conversation }: ConversationItemProps) {
  const hasUnread = conversation.unreadCount > 0
  const [showActions, setShowActions] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsArchiving(true)
    try {
      const action = conversation.isArchived ? 'unarchive' : 'archive'
      const response = await fetch(`/api/messages/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update conversation')
      }

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error('Error archiving conversation:', error)
      alert('Failed to update conversation')
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Link
        href={`/messages/${conversation.id}`}
        className="block hover:bg-gray-50 transition-colors"
      >
        <div className="p-4 flex items-start gap-3">
        {/* Avatar */}
        {conversation.otherUser.avatarUrl ? (
          <img
            src={conversation.otherUser.avatarUrl}
            alt={conversation.otherUser.displayName}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {conversation.otherUser.displayName[0].toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className={`font-semibold ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {conversation.otherUser.displayName}
            </h3>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-1">@{conversation.otherUser.username}</p>

          {conversation.lastMessage && (
            <p
              className={`text-sm truncate ${
                hasUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              {conversation.lastMessage.content}
            </p>
          )}
        </div>

        {/* Unread badge */}
        {hasUnread && (
          <div className="flex-shrink-0 ml-2">
            <div className="bg-blue-600 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
              {conversation.unreadCount}
            </div>
          </div>
        )}

        {/* Muted indicator */}
        {conversation.isMuted && (
          <div className="flex-shrink-0 ml-2 text-gray-400" title="Muted">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </Link>

      {/* Archive/Unarchive button */}
      {showActions && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 disabled:opacity-50"
            title={conversation.isArchived ? 'Unarchive' : 'Archive'}
          >
            {conversation.isArchived ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
