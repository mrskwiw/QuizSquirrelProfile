import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  message: string
  actorId?: string
  actorName?: string
  actorAvatar?: string
  quizId?: string
  quizTitle?: string
  commentId?: string
  commentText?: string
  actionUrl?: string
}

/**
 * Creates a notification for a user
 * @param params - Notification parameters including userId, type, and message
 * @returns The created notification or null if creation fails
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Don't send notification to yourself
    if (params.actorId === params.userId) {
      return null
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        message: params.message,
        actorId: params.actorId,
        actorName: params.actorName,
        actorAvatar: params.actorAvatar,
        quizId: params.quizId,
        quizTitle: params.quizTitle,
        commentId: params.commentId,
        commentText: params.commentText,
        actionUrl: params.actionUrl,
      },
    })

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Notifies quiz creator of an action on their quiz
 * @param quizId - The quiz ID
 * @param actorId - The user ID performing the action
 * @param actorName - The user's display name
 * @param actorAvatar - The user's avatar URL
 * @param type - The type of action performed
 * @param additionalData - Optional additional data (e.g., comment text)
 * @returns The created notification or null
 */
export async function notifyQuizCreator(
  quizId: string,
  actorId: string,
  actorName: string,
  actorAvatar: string | null,
  type: 'COMMENT' | 'QUIZ_TAKEN' | 'QUIZ_LIKED',
  additionalData?: {
    commentText?: string
    commentId?: string
  }
) {
  try {
    // Get quiz and creator
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        creatorId: true,
      },
    })

    if (!quiz || quiz.creatorId === actorId) {
      return null
    }

    let message = ''
    let notificationType: NotificationType
    const actionUrl = `/quiz/${quizId}`

    switch (type) {
      case 'COMMENT':
        message = `${actorName} commented on your quiz "${quiz.title}"`
        notificationType = 'COMMENT_ON_QUIZ'
        break
      case 'QUIZ_TAKEN':
        message = `${actorName} took your quiz "${quiz.title}"`
        notificationType = 'QUIZ_TAKEN'
        break
      case 'QUIZ_LIKED':
        message = `${actorName} liked your quiz "${quiz.title}"`
        notificationType = 'QUIZ_LIKED'
        break
    }

    return await createNotification({
      userId: quiz.creatorId,
      type: notificationType,
      message,
      actorId,
      actorName,
      actorAvatar: actorAvatar || undefined,
      quizId: quiz.id,
      quizTitle: quiz.title,
      commentId: additionalData?.commentId,
      commentText: additionalData?.commentText,
      actionUrl,
    })
  } catch (error) {
    console.error('Error notifying quiz creator:', error)
    return null
  }
}

/**
 * Notifies a user when they gain a new follower
 * @param followedUserId - The user ID being followed
 * @param followerUserId - The user ID of the new follower
 * @param followerName - The follower's display name
 * @param followerAvatar - The follower's avatar URL
 * @returns The created notification or null
 */
export async function notifyNewFollower(
  followedUserId: string,
  followerUserId: string,
  followerName: string,
  followerAvatar: string | null
) {
  try {
    return await createNotification({
      userId: followedUserId,
      type: 'NEW_FOLLOWER',
      message: `${followerName} started following you`,
      actorId: followerUserId,
      actorName: followerName,
      actorAvatar: followerAvatar || undefined,
      actionUrl: `/profile/${followerName.toLowerCase().replace(/\s+/g, '')}`,
    })
  } catch (error) {
    console.error('Error notifying new follower:', error)
    return null
  }
}

/**
 * Notifies a user when someone replies to their comment
 * @param parentCommentId - The ID of the parent comment
 * @param replyAuthorId - The user ID of the reply author
 * @param replyAuthorName - The reply author's display name
 * @param replyAuthorAvatar - The reply author's avatar URL
 * @param replyText - The text of the reply
 * @param quizId - The quiz ID where the comment was made
 * @returns The created notification or null
 */
export async function notifyCommentReply(
  parentCommentId: string,
  replyAuthorId: string,
  replyAuthorName: string,
  replyAuthorAvatar: string | null,
  replyText: string,
  quizId: string
) {
  try {
    // Get parent comment author
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: {
        userId: true,
        User: {
          select: {
            username: true,
          },
        },
        Quiz: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!parentComment || parentComment.userId === replyAuthorId) {
      return null
    }

    return await createNotification({
      userId: parentComment.userId,
      type: 'COMMENT_REPLY',
      message: `${replyAuthorName} replied to your comment on "${parentComment.Quiz.title}"`,
      actorId: replyAuthorId,
      actorName: replyAuthorName,
      actorAvatar: replyAuthorAvatar || undefined,
      quizId,
      quizTitle: parentComment.Quiz.title,
      commentText: replyText,
      actionUrl: `/quiz/${quizId}`,
    })
  } catch (error) {
    console.error('Error notifying comment reply:', error)
    return null
  }
}

/**
 * Notifies a user of a new message
 * @param recipientId - The user ID of the message recipient
 * @param senderId - The user ID of the message sender
 * @param senderName - The sender's display name
 * @param senderAvatar - The sender's avatar URL
 * @param conversationId - The conversation ID
 * @param messagePreview - Preview text of the message
 * @returns The created notification or null
 */
export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | null,
  conversationId: string,
  messagePreview: string
) {
  try {
    // Truncate message preview to 100 characters
    const truncatedPreview = messagePreview.length > 100
      ? messagePreview.substring(0, 100) + '...'
      : messagePreview

    return await createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      message: `${senderName} sent you a message: "${truncatedPreview}"`,
      actorId: senderId,
      actorName: senderName,
      actorAvatar: senderAvatar || undefined,
      actionUrl: `/messages/${conversationId}`,
    })
  } catch (error) {
    console.error('Error notifying new message:', error)
    return null
  }
}
