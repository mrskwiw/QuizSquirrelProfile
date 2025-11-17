/**
 * Tumblr Disconnect
 * POST /api/social/tumblr/auth/disconnect
 *
 * Disconnects a Tumblr blog from the user's account.
 * Deletes the stored OAuth tokens and all associated published posts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Find the connection
    const connection = await prisma.socialMediaConnection.findFirst({
      where: {
        id: connectionId,
        userId: user.id,
        platform: 'TUMBLR',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete the connection (cascade will delete associated posts)
    await prisma.socialMediaConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Tumblr blog disconnected successfully',
    });
  } catch (error: any) {
    console.error('Tumblr disconnect error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to disconnect Tumblr blog',
      },
      { status: 500 }
    );
  }
}
