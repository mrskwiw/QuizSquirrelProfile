import { useState, FormEvent, KeyboardEvent } from 'react'
import { MAX_MESSAGE_LENGTH } from '@/types/messages'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
  onTyping?: () => void
}

export function MessageInput({ onSend, disabled = false, placeholder = 'Type a message...', onTyping }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Send typing indicator
    if (onTyping) {
      onTyping()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent || sending || disabled) return

    try {
      setSending(true)
      await onSend(trimmedContent)
      setContent('') // Clear input after sending
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const remaining = MAX_MESSAGE_LENGTH - content.length
  const isNearLimit = remaining < 100

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-2">
        {/* Text input */}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            className="
              flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              min-h-[40px] max-h-[120px]
            "
            style={{
              height: 'auto',
              overflowY: content.length > 100 ? 'auto' : 'hidden',
            }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!content.trim() || disabled || sending}
            className="
              px-6 py-2 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300
              transition-colors
            "
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Character count (only show when near limit) */}
        {isNearLimit && (
          <div className={`text-xs text-right ${remaining < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {remaining} characters remaining
          </div>
        )}

        {/* Hint text */}
        <div className="text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </form>
  )
}
