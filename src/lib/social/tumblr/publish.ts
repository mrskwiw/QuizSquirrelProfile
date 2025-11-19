/**
 * Tumblr Publishing Logic
 * Handles publishing quizzes to Tumblr blogs
 */

import { createAuthenticatedTumblrClient } from './client';
import { formatQuizForTumblr, generateQuizUrl, generateAttributionText } from '../formatter';
import { decryptToken } from '../encryption';
import { prisma } from '@/lib/prisma';
import type { QuizShareContent, PublishResult } from '../types';
import { SocialMediaError } from '../types';

/**
 * Publish a quiz to a Tumblr blog
 */
export async function publishQuizToTumblr(
  quizId: string,
  connectionId: string,
  userId: string,
  customMessage?: string
): Promise<PublishResult> {
  try {
    // Get the connection with decrypted tokens
    const connection = await prisma.socialMediaConnection.findFirst({
      where: {
        id: connectionId,
        userId,
        platform: 'TUMBLR',
        isActive: true,
      },
    });

    if (!connection) {
      throw new SocialMediaError(
        'Tumblr connection not found or inactive',
        'CONNECTION_NOT_FOUND',
        'TUMBLR'
      );
    }

    if (!connection.tumblrBlogName || !connection.tumblrOAuthToken || !connection.tumblrOAuthSecret) {
      throw new SocialMediaError(
        'Invalid Tumblr connection configuration',
        'INVALID_CREDENTIALS',
        'TUMBLR'
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
      throw new SocialMediaError(
        'Quiz not found',
        'QUIZ_NOT_FOUND',
        'TUMBLR'
      );
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
          'You don\'t have permission to share this quiz',
          'PERMISSION_DENIED',
          'TUMBLR'
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

    // Format for Tumblr
    const postData = formatQuizForTumblr(shareContent);

    // Decrypt tokens
    const accessToken = decryptToken(connection.tumblrOAuthToken);
    const accessTokenSecret = decryptToken(connection.tumblrOAuthSecret);

    // Create Tumblr client
    const client = createAuthenticatedTumblrClient(accessToken, accessTokenSecret);

    // Debug logging
    console.log('=== Tumblr Publish Debug ===');
    console.log('Blog Name:', connection.tumblrBlogName);
    console.log('Post Data:', JSON.stringify(postData, null, 2));
    console.log('Share Content:', JSON.stringify(shareContent, null, 2));
    console.log('===========================');

    // Publish to Tumblr using modern NPF (Neue Post Format)
    // This supports rich media, interactive polls, formatted text, and images
    const result = await client.createPost(connection.tumblrBlogName, postData);

    // Debug: Log the result to see what Tumblr returns
    console.log('=== Tumblr API Response ===');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('===========================');

    // Store post in database
    // Use id_string to avoid JavaScript number precision issues
    const postId = result.id_string || result.id.toString();
    const post = await prisma.socialMediaPost.create({
      data: {
        quizId,
        connectionId,
        platform: 'TUMBLR',
        externalPostId: postId,
        externalUrl: `https://${connection.tumblrBlogName}.tumblr.com/post/${postId}`,
        publishedAt: new Date(),
      },
    });

    // Create notification for quiz creator (if different from publisher)
    if (quiz.creatorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: quiz.creatorId,
          type: 'QUIZ_MILESTONE',
          message: `Your quiz "${quiz.title}" was shared on Tumblr!`,
          actionUrl: `/quiz/${quizId}`,
        },
      });
    }

    return {
      success: true,
      postId: post.id,
      postUrl: post.externalUrl || undefined,
      platform: 'TUMBLR',
    };
  } catch (error: any) {
    console.error('Tumblr publish error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data || error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message || 'Failed to publish to Tumblr',
      platform: 'TUMBLR',
    };
  }
}

/**
 * Delete a published quiz from Tumblr
 */
export async function deletePostFromTumblr(
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
        'You don\'t have permission to delete this post',
        'PERMISSION_DENIED',
        'TUMBLR'
      );
    }

    // Decrypt tokens
    if (!post.SocialMediaConnection.tumblrOAuthToken || !post.SocialMediaConnection.tumblrOAuthSecret || !post.SocialMediaConnection.tumblrBlogName) {
      throw new Error('Invalid connection configuration');
    }

    const accessToken = decryptToken(post.SocialMediaConnection.tumblrOAuthToken);
    const accessTokenSecret = decryptToken(post.SocialMediaConnection.tumblrOAuthSecret);

    // Create Tumblr client
    const client = createAuthenticatedTumblrClient(accessToken, accessTokenSecret);

    // Delete from Tumblr
    await client.deletePost(post.SocialMediaConnection.tumblrBlogName, post.externalPostId);

    // Delete from database
    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    return true;
  } catch (error: any) {
    console.error('Tumblr delete error:', error);
    throw error;
  }
}

/**
 * Sync engagement metrics for a Tumblr post
 */
export async function syncTumblrPostMetrics(
  postId: string
): Promise<void> {
  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        SocialMediaConnection: true,
      },
    });

    if (!post || post.platform !== 'TUMBLR') {
      throw new Error('Tumblr post not found');
    }

    // Decrypt tokens
    if (!post.SocialMediaConnection.tumblrOAuthToken || !post.SocialMediaConnection.tumblrOAuthSecret || !post.SocialMediaConnection.tumblrBlogName) {
      throw new Error('Invalid connection configuration');
    }

    const accessToken = decryptToken(post.SocialMediaConnection.tumblrOAuthToken);
    const accessTokenSecret = decryptToken(post.SocialMediaConnection.tumblrOAuthSecret);

    // Create Tumblr client
    const client = createAuthenticatedTumblrClient(accessToken, accessTokenSecret);

    // Fetch post info
    const blogPosts = await client.blogPosts(post.SocialMediaConnection.tumblrBlogName, {
      id: post.externalPostId,
    });

    if (blogPosts.posts && blogPosts.posts.length > 0) {
      const tumblrPost = blogPosts.posts[0];

      // Update metrics in database
      // note_count includes both likes and reblogs
      await prisma.socialMediaPost.update({
        where: { id: postId },
        data: {
          likes: tumblrPost.note_count || 0,
          shares: 0, // Tumblr doesn't separate reblogs in this response
          comments: 0, // Would need separate call to get comment count
          views: 0, // Tumblr doesn't provide view count in basic API
          lastSyncedAt: new Date(),
        },
      });
    }
  } catch (error: any) {
    console.error('Sync Tumblr metrics error:', error);
    throw error;
  }
}

/**
 * Sync metrics for all Tumblr posts for a user
 * This can be called by a cron job daily
 */
export async function syncAllTumblrPosts(userId: string): Promise<void> {
  try {
    // Get all active Tumblr connections for user
    const connections = await prisma.socialMediaConnection.findMany({
      where: {
        userId,
        platform: 'TUMBLR',
        isActive: true,
      },
      include: {
        SocialMediaPost: {
          where: {
            platform: 'TUMBLR',
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
          await syncTumblrPostMetrics(post.id);
        } catch (error) {
          console.error(`Failed to sync post ${post.id}:`, error);
          // Continue with other posts
        }
      }
    }
  } catch (error: any) {
    console.error('Sync all Tumblr posts error:', error);
    throw error;
  }
}
