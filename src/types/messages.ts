import type { Conversation, ConversationParticipant, Message, MessageReaction, MessageRead, MessageStatus, Prisma } from '@prisma/client'

// Extended types with relations
export type ConversationWithParticipants = Conversation & {
  ConversationParticipant: (ConversationParticipant & {
    User: {
      id: string
      username: string
      displayName: string
      avatarUrl: string | null
    }
  })[]
  Message?: MessageWithSender[]
  _count?: {
    Message: number
  }
}

export type MessageWithSender = Message & {
  User: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  MessageReaction?: MessageReaction[]
  MessageRead?: MessageRead[]
}

export type ConversationListItem = {
  id: string
  type: string
  lastMessageAt: Date
  otherUser: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  lastMessage?: {
    id: string
    content: string
    createdAt: Date
    senderId: string
  }
  unreadCount: number
  isArchived: boolean
  isMuted: boolean
}

// API Request/Response types
export type CreateConversationRequest = {
  userId: string // The other user to start conversation with
}

export type CreateConversationResponse = {
  conversation: ConversationWithParticipants
}

export type SendMessageRequest = {
  conversationId: string
  content: string
  contentType?: 'text' | 'image' | 'quiz_link'
  metadata?: Prisma.InputJsonValue
}

export type SendMessageResponse = {
  message: MessageWithSender
}

export type GetConversationsResponse = {
  conversations: ConversationListItem[]
}

export type GetMessagesRequest = {
  conversationId: string
  limit?: number
  before?: string // Message ID for pagination
}

export type GetMessagesResponse = {
  messages: MessageWithSender[]
  hasMore: boolean
}

export type UnreadCountResponse = {
  count: number
}

export type PollMessagesResponse = {
  newMessages: MessageWithSender[]
  updatedConversations: string[] // IDs of conversations with new activity
}

// Settings types
export type MessagePrivacySetting = 'everyone' | 'following' | 'nobody'

export type MessageSettings = {
  whoCanMessage: MessagePrivacySetting
  readReceipts: boolean
  typingIndicators: boolean
  emailNotifications: 'immediate' | 'hourly' | 'daily' | 'off'
  soundAlerts: boolean
}

// Typing indicator type
export type TypingIndicator = {
  conversationId: string
  userId: string
  username: string
  timestamp: Date
}

// Message validation
export const MAX_MESSAGE_LENGTH = 2000
export const MESSAGE_POLL_INTERVAL = 5000 // 5 seconds
export const TYPING_INDICATOR_TIMEOUT = 3000 // 3 seconds

// Helper type guards
export function isTextMessage(message: Message): boolean {
  return message.contentType === 'text'
}

export function isImageMessage(message: Message): boolean {
  return message.contentType === 'image'
}

export function isQuizLinkMessage(message: Message): boolean {
  return message.contentType === 'quiz_link'
}

export function isMessageDeleted(message: Message): boolean {
  return message.deletedAt !== null
}

export function isMessageEdited(message: Message): boolean {
  return message.updatedAt !== null && message.updatedAt.getTime() !== message.createdAt.getTime()
}

export function canEditMessage(message: Message, currentUserId: string): boolean {
  if (message.senderId !== currentUserId) return false
  if (isMessageDeleted(message)) return false

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  return message.createdAt > fifteenMinutesAgo
}

export function canDeleteMessage(message: Message, currentUserId: string): boolean {
  return message.senderId === currentUserId && !isMessageDeleted(message)
}
