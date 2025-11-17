'use client'

import { useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { BlockButton } from '@/components/user/BlockButton'
import Link from 'next/link'

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  otherUser: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export function MessageThread({ conversationId, currentUserId, otherUser }: MessageThreadProps) {
  const { messages, loading, error, hasMore, loadMore, markAsRead, addMessage, updateMessage, removeMessage } = useMessages(conversationId)
  const { sendMessage, sending, error: sendError } = useSendMessage()
  const { typingUserIds, onTyping } = useTypingIndicator(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const isOtherUserTyping = typingUserIds.includes(otherUser.id)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Mark as read when conversation is viewed
  useEffect(() => {
    if (conversationId) {
      markAsRead()
    }
  }, [conversationId, markAsRead])

  const handleSend = async (content: string) => {
    const message = await sendMessage(conversationId, content)
    if (message) {
      addMessage(message)
    }
  }

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to edit message')
      }

      const updatedMessage = await response.json()
      updateMessage(updatedMessage)
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete message')
      }

      removeMessage(messageId)
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add reaction')
      }

      // Refresh messages to get updated reactions
      // In a real app, you'd want to optimistically update the UI
      // For now, the polling will pick up the change
    } catch (error) {
      console.error('Error adding reaction:', error)
      throw error
    }
  }

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove reaction')
      }

      // Refresh messages to get updated reactions
    } catch (error) {
      console.error('Error removing reaction:', error)
      throw error
    }
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return

    // Check if scrolled to top
    if (container.scrollTop === 0 && hasMore && !loading) {
      loadMore()
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load messages</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/messages"
              className="text-gray-600 hover:text-gray-900"
              aria-label="Back to messages"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* User info */}
            <Link
              href={`/profile/${otherUser.username}`}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 -m-2"
            >
              {otherUser.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {otherUser.displayName[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">{otherUser.displayName}</div>
                <div className="text-sm text-gray-600">@{otherUser.username}</div>
              </div>
            </Link>
          </div>

          {/* Block button */}
          <BlockButton
            userId={otherUser.id}
            username={otherUser.username}
            variant="ghost"
            size="sm"
          />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-600">
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  {loading ? 'Loading...' : 'Load more messages'}
                </button>
              </div>
            )}

            {/* Reverse messages to show newest at bottom */}
            {[...messages].reverse().map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReact={handleReact}
                onRemoveReaction={handleRemoveReaction}
              />
            ))}

            <div ref={messagesEndRef} />

            {/* Typing indicator */}
            {isOtherUserTyping && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[70%] items-start flex flex-col">
                  <div className="text-xs text-gray-600 mb-1 px-1">
                    {otherUser.displayName}
                  </div>
                  <div className="bg-gray-200 text-gray-900 rounded-2xl px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Send error */}
      {sendError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{sendError}</p>
        </div>
      )}

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending} onTyping={onTyping} />
    </div>
  )
}
