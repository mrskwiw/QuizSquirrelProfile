/**
 * Tumblr Post Management API
 * DELETE /api/social/tumblr/posts/[postId] - Delete a post
 * GET /api/social/tumblr/posts/[postId] - Get post details
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deletePostFromTumblr, syncTumblrPostMetrics } from '@/lib/social/tumblr/publish';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    postId: string;
  }>;
}

/**
 * GET - Get post details and metrics
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Get the post
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
        connection: {
          select: {
            id: true,
            userId: true,
            tumblrBlogName: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify user owns the connection
    if (post.connection.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        quiz: post.quiz,
        platform: post.platform,
        blogName: post.connection.tumblrBlogName,
        externalUrl: post.externalUrl,
        publishedAt: post.publishedAt,
        metrics: {
          likes: post.likes,
          shares: post.shares,
          comments: post.comments,
          views: post.views,
          lastSyncedAt: post.lastSyncedAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Get Tumblr post error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get post details',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a published post
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    await deletePostFromTumblr(postId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Tumblr post error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete post',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Sync metrics for a post
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Verify ownership before syncing
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        connection: {
          select: { userId: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.connection.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await syncTumblrPostMetrics(postId);

    // Get updated post
    const updatedPost = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
      select: {
        likes: true,
        shares: true,
        comments: true,
        views: true,
        lastSyncedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      metrics: updatedPost,
    });
  } catch (error: any) {
    console.error('Sync Tumblr post error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync post metrics',
      },
      { status: 500 }
    );
  }
}
