import { useState, useEffect, useCallback, useRef } from 'react'

export function useTypingIndicator(conversationId: string | null) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    if (!conversationId) return

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }, [conversationId])

  // Debounced typing indicator
  const onTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    sendTypingIndicator()

    // Send again in 2 seconds if still typing
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator()
    }, 2000)
  }, [sendTypingIndicator])

  // Fetch typing indicators
  const fetchTypingIndicators = useCallback(async () => {
    if (!conversationId) return

    try {
      const response = await fetch(
        `/api/messages/typing?conversationId=${conversationId}`
      )

      if (response.ok) {
        const data = await response.json()
        setTypingUserIds(data.typingUserIds || [])
      }
    } catch (error) {
      console.error('Failed to fetch typing indicators:', error)
    }
  }, [conversationId])

  // Poll for typing indicators every 1 second
  useEffect(() => {
    if (!conversationId) return

    fetchTypingIndicators()
    const interval = setInterval(fetchTypingIndicators, 1000)

    return () => {
      clearInterval(interval)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversationId, fetchTypingIndicators])

  return {
    typingUserIds,
    onTyping,
  }
}
