import { prisma } from './prisma'
import { validateMessageId, validateUserId } from './message-validation'

// Allowed reactions (basic emoji set)
const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

/**
 * Validate emoji reaction
 */
function validateEmoji(emoji: string): void {
  if (!ALLOWED_REACTIONS.includes(emoji)) {
    throw new Error(`Invalid emoji. Allowed: ${ALLOWED_REACTIONS.join(', ')}`)
  }
}

/**
 * Add a reaction to a message
 */
export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  // Validate inputs
  validateMessageId(messageId)
  validateUserId(userId)
  validateEmoji(emoji)

  // Check if message exists and user has access
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      Conversation: {
        include: {
          ConversationParticipant: {
            where: { userId },
          },
        },
      },
    },
  })

  if (!message) {
    throw new Error('Message not found')
  }

  if (message.Conversation.ConversationParticipant.length === 0) {
    throw new Error('Not authorized to react to this message')
  }

  // Check if user already reacted with this emoji
  const existingReaction = await prisma.messageReaction.findFirst({
    where: {
      messageId,
      userId,
      emoji,
    },
  })

  if (existingReaction) {
    // Already reacted, return existing reaction
    return existingReaction
  }

  // Create reaction
  const reaction = await prisma.messageReaction.create({
    data: {
      messageId,
      userId,
      emoji,
    },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  })

  return reaction
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  validateMessageId(messageId)
  validateUserId(userId)
  validateEmoji(emoji)

  // Find and delete reaction
  const reaction = await prisma.messageReaction.findFirst({
    where: {
      messageId,
      userId,
      emoji,
    },
  })

  if (!reaction) {
    throw new Error('Reaction not found')
  }

  await prisma.messageReaction.delete({
    where: { id: reaction.id },
  })
}

/**
 * Get all reactions for a message
 */
export async function getMessageReactions(messageId: string) {
  validateMessageId(messageId)

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return reactions
}

/**
 * Get reaction summary for a message (grouped by emoji)
 */
export async function getReactionSummary(messageId: string) {
  validateMessageId(messageId)

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId },
    select: {
      emoji: true,
      userId: true,
    },
  })

  // Group reactions by emoji
  const summary = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        userIds: [],
      }
    }
    acc[reaction.emoji].count++
    acc[reaction.emoji].userIds.push(reaction.userId)
    return acc
  }, {} as Record<string, { emoji: string; count: number; userIds: string[] }>)

  return Object.values(summary)
}
