import { useState, useEffect } from 'react'
import type { ConversationListItem } from '@/types/messages'

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/messages/conversations')

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()

      // Refresh conversations list
      await fetchConversations()

      return data.conversation
    } catch (err) {
      throw err
    }
  }

  const archiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      })

      if (!response.ok) {
        throw new Error('Failed to archive conversation')
      }

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isArchived: true } : conv
        )
      )
    } catch (err) {
      throw err
    }
  }

  const unarchiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'unarchive' }),
      })

      if (!response.ok) {
        throw new Error('Failed to unarchive conversation')
      }

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isArchived: false } : conv
        )
      )
    } catch (err) {
      throw err
    }
  }

  const muteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mute' }),
      })

      if (!response.ok) {
        throw new Error('Failed to mute conversation')
      }

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isMuted: true } : conv
        )
      )
    } catch (err) {
      throw err
    }
  }

  const unmuteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'unmute' }),
      })

      if (!response.ok) {
        throw new Error('Failed to unmute conversation')
      }

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isMuted: false } : conv
        )
      )
    } catch (err) {
      throw err
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      // Remove from local state
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    createConversation,
    archiveConversation,
    unarchiveConversation,
    muteConversation,
    unmuteConversation,
    deleteConversation,
  }
}
