/**
 * Facebook OAuth Step 1: Initiate Authorization
 * POST /api/social/facebook/auth/connect
 *
 * This endpoint initiates the Facebook OAuth flow by generating an authorization URL.
 * Returns the URL where the user should be redirected to authorize the app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateFacebookAuthUrl, generateOAuthState } from '@/lib/social/facebook/oauth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Generate CSRF protection state
    const state = generateOAuthState();

    // Store state and user ID in HTTP-only cookies
    // These will be used in the callback to verify the request
    const cookieStore = await cookies();

    cookieStore.set('facebook_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    cookieStore.set('facebook_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    // Generate Facebook authorization URL
    const authorizationUrl = generateFacebookAuthUrl(state);

    return NextResponse.json({
      success: true,
      authorizationUrl,
      state,
    });
  } catch (error: any) {
    console.error('Facebook connect error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initiate Facebook authorization',
      },
      { status: 500 }
    );
  }
}
