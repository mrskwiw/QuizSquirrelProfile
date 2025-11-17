import { useState, useEffect, useCallback } from 'react'
import type { MessageWithSender } from '@/types/messages'

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchMessages = useCallback(
    async (before?: string) => {
      if (!conversationId) return

      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ limit: '50' })
        if (before) params.append('before', before)

        const response = await fetch(
          `/api/messages/conversations/${conversationId}/messages?${params}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }

        const data = await response.json()

        if (before) {
          // Appending older messages (pagination)
          setMessages((prev) => [...prev, ...data.messages])
        } else {
          // Initial load or refresh
          setMessages(data.messages)
        }

        setHasMore(data.hasMore)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    },
    [conversationId]
  )

  const loadMore = useCallback(() => {
    if (hasMore && messages.length > 0 && !loading) {
      const oldestMessage = messages[messages.length - 1]
      fetchMessages(oldestMessage.id)
    }
  }, [hasMore, messages, loading, fetchMessages])

  const markAsRead = useCallback(async () => {
    if (!conversationId) return

    try {
      await fetch(`/api/messages/conversations/${conversationId}/mark-read`, {
        method: 'POST',
      })
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }, [conversationId])

  const addMessage = useCallback((message: MessageWithSender) => {
    setMessages((prev) => [message, ...prev])
  }, [])

  const updateMessage = useCallback((updatedMessage: MessageWithSender) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
    )
  }, [])

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }, [])

  useEffect(() => {
    if (conversationId) {
      fetchMessages()
    }
  }, [conversationId, fetchMessages])

  return {
    messages,
    loading,
    error,
    hasMore,
    refetch: () => fetchMessages(),
    loadMore,
    markAsRead,
    addMessage,
    updateMessage,
    removeMessage,
  }
}
