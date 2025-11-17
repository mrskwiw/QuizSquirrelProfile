import { useEffect, useRef, useCallback } from 'react'
import { MESSAGE_POLL_INTERVAL } from '@/types/messages'
import type { MessageWithSender } from '@/types/messages'

interface UseMessagePollingOptions {
  enabled: boolean
  onNewMessages?: (messages: MessageWithSender[], updatedConversations: string[]) => void
}

export function useMessagePolling({ enabled, onNewMessages }: UseMessagePollingOptions) {
  const lastPollTime = useRef<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const poll = useCallback(async () => {
    try {
      const since = lastPollTime.current.toISOString()
      const response = await fetch(`/api/messages/poll?since=${since}`)

      if (!response.ok) {
        console.error('Polling failed:', response.statusText)
        return
      }

      const data = await response.json()

      // Update last poll time
      lastPollTime.current = new Date()

      // Call callback if there are new messages
      if (data.newMessages && data.newMessages.length > 0 && onNewMessages) {
        onNewMessages(data.newMessages, data.updatedConversations)
      }
    } catch (error) {
      console.error('Error polling messages:', error)
    }
  }, [onNewMessages])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Start polling
    intervalRef.current = setInterval(poll, MESSAGE_POLL_INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, poll])

  return {
    poll, // Expose manual poll function
  }
}
