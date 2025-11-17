/**
 * Social Media Connections API
 * GET /api/social/connections - Get all user's connections
 * DELETE /api/social/connections?id=... - Delete a connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - List all social media connections for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const connections = await prisma.socialMediaConnection.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        platform: true,
        tumblrBlogName: true,
        facebookPageId: true,
        facebookPageName: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
        // Don't return encrypted tokens!
        tumblrOAuthToken: false,
        tumblrOAuthSecret: false,
        facebookAccessToken: false,
        facebookPageAccessToken: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      connections,
    });
  } catch (error: any) {
    console.error('Get connections error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch connections',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a social media connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Verify connection belongs to user
    const connection = await prisma.socialMediaConnection.findFirst({
      where: {
        id: connectionId,
        userId: user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete connection (cascade will delete associated posts)
    await prisma.socialMediaConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Connection removed successfully',
    });
  } catch (error: any) {
    console.error('Delete connection error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove connection',
      },
      { status: 500 }
    );
  }
}
