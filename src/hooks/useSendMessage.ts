import { useState } from 'react'
import type { MessageWithSender } from '@/types/messages'

export function useSendMessage() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async (
    conversationId: string,
    content: string,
    contentType: string = 'text'
  ): Promise<MessageWithSender | null> => {
    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
          contentType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      const data = await response.json()
      return data.message
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setSending(false)
    }
  }

  return {
    sendMessage,
    sending,
    error,
  }
}
