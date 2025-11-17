'use client'

import { useState } from 'react'
import type { MessageWithSender } from '@/types/messages'
import { formatDistanceToNow } from 'date-fns'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  onEdit?: (messageId: string, newContent: string) => Promise<void>
  onDelete?: (messageId: string) => Promise<void>
  onReact?: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

export function MessageBubble({ message, isOwn, onEdit, onDelete, onReact, onRemoveReaction }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const isDeleted = message.deletedAt !== null
  const isEdited = message.updatedAt !== null && message.updatedAt.getTime() !== message.createdAt.getTime()

  // Check if message is within 15 minute edit window
  const messageAge = Date.now() - new Date(message.createdAt).getTime()
  const canEdit = isOwn && !isDeleted && messageAge < 15 * 60 * 1000

  const handleEdit = async () => {
    if (!onEdit || !editContent.trim()) return

    try {
      await onEdit(message.id, editContent)
      setIsEditing(false)
      setShowActions(false)
    } catch (error) {
      console.error('Failed to edit message:', error)
      alert('Failed to edit message')
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await onDelete(message.id)
        setShowActions(false)
      } catch (error) {
        console.error('Failed to delete message:', error)
        alert('Failed to delete message')
      }
    }
  }

  const handleReaction = async (emoji: string) => {
    if (!onReact || !onRemoveReaction) return

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(
      r => r.emoji === emoji && r.userId === message.senderId
    )

    try {
      if (existingReaction) {
        await onRemoveReaction(message.id, emoji)
      } else {
        await onReact(message.id, emoji)
      }
      setShowReactions(false)
    } catch (error) {
      console.error('Failed to react:', error)
    }
  }

  // Group reactions by emoji
  const reactionSummary = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, userIds: [] }
    }
    acc[reaction.emoji].count++
    acc[reaction.emoji].userIds.push(reaction.userId)
    return acc
  }, {} as Record<string, { count: number; userIds: string[] }>)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col relative`}>
        {/* Sender name (only for received messages) */}
        {!isOwn && (
          <div className="text-xs text-gray-600 mb-1 px-1">
            {message.sender.displayName}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={`
              rounded-2xl px-4 py-2 break-words
              ${
                isOwn
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }
              ${isDeleted ? 'italic opacity-60' : ''}
            `}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => !isEditing && setShowActions(false)}
          >
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[60px] p-2 text-sm bg-white text-gray-900 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(message.content)
                      setShowActions(false)
                    }}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Action buttons */}
          {showActions && !isEditing && !isDeleted && (
            <div className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} flex gap-1`}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50"
                title="React"
              >
                <span className="text-sm">😊</span>
              </button>
              {canEdit && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reaction picker */}
          {showReactions && (
            <div className={`absolute top-full mt-1 ${isOwn ? 'right-0' : 'left-0'} bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1 z-10`}>
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reactions display */}
          {reactionSummary && Object.keys(reactionSummary).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionSummary).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50"
                  title={`${data.count} reaction${data.count > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600">{data.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center gap-1 mt-1 px-1 text-xs text-gray-500">
          <span>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {isEdited && !isDeleted && (
            <>
              <span>•</span>
              <span>edited</span>
            </>
          )}
          {isOwn && (
            <>
              <span>•</span>
              {message.reads && message.reads.length > 0 ? (
                <span className="text-blue-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                  <span>Read</span>
                </span>
              ) : (
                <span className="capitalize">{message.status.toLowerCase()}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
