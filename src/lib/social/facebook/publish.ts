/**
 * Facebook Publishing Logic
 * Handles publishing quizzes to Facebook Pages
 */

import { publishPost, deletePost, getPostEngagement } from './client';
import { formatQuizForFacebook, generateQuizUrl, generateAttributionText } from '../formatter';
import { decryptToken } from '../encryption';
import { prisma } from '@/lib/prisma';
import type { QuizShareContent, PublishResult } from '../types';
import { SocialMediaError } from '../types';

/**
 * Publish a quiz to a Facebook Page
 * @param quizId - Quiz ID to publish
 * @param connectionId - Social media connection ID (Facebook Page)
 * @param userId - User ID of the publisher
 * @param customMessage - Optional custom message to override quiz title
 * @returns Publish result with post ID and URL
 */
export async function publishQuizToFacebook(
  quizId: string,
  connectionId: string,
  userId: string,
  customMessage?: string
): Promise<PublishResult> {
  try {
    // Get the connection with encrypted tokens
    const connection = await prisma.socialMediaConnection.findFirst({
      where: {
        id: connectionId,
        userId,
        platform: 'FACEBOOK',
        isActive: true,
      },
    });

    if (!connection) {
      throw new SocialMediaError(
        'Facebook connection not found or inactive',
        'CONNECTION_NOT_FOUND',
        'FACEBOOK'
      );
    }

    // Validate connection has required fields
    if (
      !connection.facebookPageId ||
      !connection.facebookPageName ||
      !connection.facebookPageAccessToken
    ) {
      throw new SocialMediaError(
        'Invalid Facebook connection configuration',
        'INVALID_CREDENTIALS',
        'FACEBOOK'
      );
    }

    // Get the quiz with questions for preview
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        User: {
          select: {
            username: true,
            displayName: true,
          },
        },
        Question: {
          select: {
            questionText: true,
            questionType: true,
            orderIndex: true,
            QuestionOption: {
              select: {
                optionText: true,
              },
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
          take: 3, // Only fetch first 3 questions for preview
        },
      },
    });

    if (!quiz) {
      throw new SocialMediaError('Quiz not found', 'QUIZ_NOT_FOUND', 'FACEBOOK');
    }

    // Check if quiz is published
    if (quiz.status !== 'PUBLISHED') {
      throw new Error('Only published quizzes can be shared');
    }

    // Check permissions - user can share any public quiz
    if (!quiz.isPublic) {
      // Check if user has access (creator or community member)
      const hasAccess = quiz.creatorId === userId;
      if (!hasAccess) {
        throw new SocialMediaError(
          "You don't have permission to share this quiz",
          'PERMISSION_DENIED',
          'FACEBOOK'
        );
      }
    }

    // Prepare quiz content
    const quizUrl = generateQuizUrl(quizId);
    const creatorName = quiz.User.displayName || quiz.User.username;

    // Add sharer attribution if sharing someone else's quiz
    let attribution = creatorName;
    if (quiz.creatorId !== userId) {
      const sharer = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, displayName: true },
      });
      if (sharer) {
        attribution = generateAttributionText(
          creatorName,
          sharer.displayName || sharer.username
        );
      }
    }

    const shareContent: QuizShareContent = {
      title: customMessage || quiz.title,
      description: quiz.description,
      coverImage: quiz.coverImage,
      category: quiz.category,
      tags: quiz.tags,
      quizUrl,
      creatorName: attribution,
      questions: quiz.Question.map((q: any) => ({
        text: q.questionText,
        type: q.questionType,
        options: q.QuestionOption?.map((opt: any) => ({
          text: opt.optionText,
        })),
      })),
    };

    // Format for Facebook
    const postData = formatQuizForFacebook(shareContent);

    // Decrypt page access token
    const pageAccessToken = decryptToken(connection.facebookPageAccessToken);

    // Debug logging
    console.log('=== Facebook Publish Debug ===');
    console.log('Page ID:', connection.facebookPageId);
    console.log('Page Name:', connection.facebookPageName);
    console.log('Post Data:', JSON.stringify(postData, null, 2));
    console.log('Share Content:', JSON.stringify(shareContent, null, 2));
    console.log('===========================');

    // Publish to Facebook Page
    const result = await publishPost(
      connection.facebookPageId,
      pageAccessToken,
      postData
    );

    // Debug: Log the result
    console.log('=== Facebook API Response ===');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('===========================');

    // Facebook post ID format: pageId_postId
    const postId = result.id;
    const postUrl = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;

    // Store post in database
    const post = await prisma.socialMediaPost.create({
      data: {
        quizId,
        connectionId,
        platform: 'FACEBOOK',
        externalPostId: postId,
        externalUrl: postUrl,
        publishedAt: new Date(),
      },
    });

    // Create notification for quiz creator (if different from publisher)
    if (quiz.creatorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: quiz.creatorId,
          type: 'QUIZ_MILESTONE',
          message: `Your quiz "${quiz.title}" was shared on Facebook!`,
          actionUrl: `/quiz/${quizId}`,
        },
      });
    }

    return {
      success: true,
      postId: post.id,
      postUrl: post.externalUrl || undefined,
      platform: 'FACEBOOK',
    };
  } catch (error: any) {
    console.error('Facebook publish error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message || 'Failed to publish to Facebook',
      platform: 'FACEBOOK',
    };
  }
}

/**
 * Delete a published quiz from Facebook
 * @param postId - Social media post ID (internal database ID)
 * @param userId - User ID requesting deletion
 * @returns True if successful
 */
export async function deletePostFromFacebook(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get the post
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        SocialMediaConnection: true,
        Quiz: true,
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Verify user owns the connection
    if (post.SocialMediaConnection.userId !== userId) {
      throw new SocialMediaError(
        "You don't have permission to delete this post",
        'PERMISSION_DENIED',
        'FACEBOOK'
      );
    }

    // Verify platform
    if (post.platform !== 'FACEBOOK') {
      throw new Error('This is not a Facebook post');
    }

    // Decrypt tokens
    if (!post.SocialMediaConnection.facebookPageAccessToken) {
      throw new Error('Invalid connection configuration');
    }

    const pageAccessToken = decryptToken(
      post.SocialMediaConnection.facebookPageAccessToken
    );

    // Delete from Facebook
    await deletePost(post.externalPostId, pageAccessToken);

    // Delete from database
    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    return true;
  } catch (error: any) {
    console.error('Facebook delete error:', error);
    throw error;
  }
}

/**
 * Sync engagement metrics for a Facebook post
 * @param postId - Social media post ID (internal database ID)
 */
export async function syncFacebookPostMetrics(postId: string): Promise<void> {
  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        SocialMediaConnection: true,
      },
    });

    if (!post || post.platform !== 'FACEBOOK') {
      throw new Error('Facebook post not found');
    }

    // Decrypt token
    if (!post.SocialMediaConnection.facebookPageAccessToken) {
      throw new Error('Invalid connection configuration');
    }

    const pageAccessToken = decryptToken(
      post.SocialMediaConnection.facebookPageAccessToken
    );

    // Fetch engagement metrics
    const engagement = await getPostEngagement(
      post.externalPostId,
      pageAccessToken
    );

    // Update metrics in database
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        likes: engagement.likes,
        shares: engagement.shares,
        comments: engagement.comments,
        views: 0, // Facebook doesn't provide view count for Page posts
        lastSyncedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Sync Facebook metrics error:', error);
    throw error;
  }
}

/**
 * Sync metrics for all Facebook posts for a user
 * This can be called by a cron job daily
 * @param userId - User ID
 */
export async function syncAllFacebookPosts(userId: string): Promise<void> {
  try {
    // Get all active Facebook connections for user
    const connections = await prisma.socialMediaConnection.findMany({
      where: {
        userId,
        platform: 'FACEBOOK',
        isActive: true,
      },
      include: {
        SocialMediaPost: {
          where: {
            platform: 'FACEBOOK',
            // Only sync posts from last 30 days
            publishedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    // Sync each post
    for (const connection of connections) {
      for (const post of connection.SocialMediaPost) {
        try {
          await syncFacebookPostMetrics(post.id);
        } catch (error) {
          console.error(`Failed to sync post ${post.id}:`, error);
          // Continue with other posts
        }
      }
    }
  } catch (error: any) {
    console.error('Sync all Facebook posts error:', error);
    throw error;
  }
}
