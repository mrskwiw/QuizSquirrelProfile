/**
 * Facebook Disconnect API
 * DELETE /api/social/facebook/auth/disconnect
 *
 * Removes a Facebook Page connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { connectionId } = body;

    // Validate required field
    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection ID is required',
        },
        { status: 400 }
      );
    }

    // Get the connection
    const connection = await prisma.socialMediaConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection not found',
        },
        { status: 404 }
      );
    }

    // Verify user owns the connection
    if (connection.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to disconnect this connection',
        },
        { status: 403 }
      );
    }

    // Verify it's a Facebook connection
    if (connection.platform !== 'FACEBOOK') {
      return NextResponse.json(
        {
          success: false,
          error: 'This is not a Facebook connection',
        },
        { status: 400 }
      );
    }

    // Delete the connection
    // Note: Posts will be preserved in the database but won't be deletable/syncable
    await prisma.socialMediaConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Facebook Page disconnected successfully',
    });
  } catch (error: any) {
    console.error('Facebook disconnect API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to disconnect Facebook Page',
      },
      { status: 500 }
    );
  }
}
