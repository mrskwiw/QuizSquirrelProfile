/**
 * Facebook Publish API
 * POST /api/social/facebook/publish
 *
 * Publishes a quiz to a connected Facebook Page
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { publishQuizToFacebook } from '@/lib/social/facebook/publish';

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

    // Publish to Facebook
    const result = await publishQuizToFacebook(
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
    console.error('Facebook publish API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to publish to Facebook',
        platform: 'FACEBOOK',
      },
      { status: 500 }
    );
  }
}
