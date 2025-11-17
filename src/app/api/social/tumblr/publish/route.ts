/**
 * Tumblr Publish API
 * POST /api/social/tumblr/publish
 *
 * Publishes a quiz to a connected Tumblr blog
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { publishQuizToTumblr } from '@/lib/social/tumblr/publish';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { quizId, connectionId, customMessage } = body;

    // Validate required fields
    if (!quizId || !connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quiz ID and connection ID are required',
        },
        { status: 400 }
      );
    }

    // Publish to Tumblr
    const result = await publishQuizToTumblr(
      quizId,
      connectionId,
      user.id,
      customMessage
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Tumblr publish API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to publish to Tumblr',
        platform: 'TUMBLR',
      },
      { status: 500 }
    );
  }
}
