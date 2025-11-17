/**
 * Tumblr OAuth Step 1: Request Temporary Token
 * POST /api/social/tumblr/auth/request-token
 *
 * This endpoint initiates the Tumblr OAuth flow by requesting a temporary token.
 * Returns the authorization URL where the user should be redirected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requestTumblrToken, getTumblrAuthorizationUrl, generateOAuthState } from '@/lib/social/tumblr/oauth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Generate callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/social/tumblr/auth/callback`;

    // Request temporary token from Tumblr
    const { oauthToken, oauthTokenSecret } = await requestTumblrToken(callbackUrl);

    // Generate CSRF protection state
    const state = generateOAuthState();

    // Store temporary token and state in HTTP-only cookies
    // These will be used in the callback
    const cookieStore = await cookies();
    cookieStore.set('tumblr_oauth_token', oauthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    cookieStore.set('tumblr_oauth_token_secret', oauthTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    cookieStore.set('tumblr_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    cookieStore.set('tumblr_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    // Get authorization URL
    const authorizationUrl = getTumblrAuthorizationUrl(oauthToken);

    return NextResponse.json({
      success: true,
      authorizationUrl,
      state,
    });
  } catch (error: any) {
    console.error('Tumblr request token error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initiate Tumblr authorization',
      },
      { status: 500 }
    );
  }
}
