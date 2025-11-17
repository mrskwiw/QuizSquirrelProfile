/**
 * Tumblr OAuth Step 3: Handle Callback
 * GET /api/social/tumblr/auth/callback?oauth_token=...&oauth_verifier=...
 *
 * This endpoint handles the callback from Tumblr after the user authorizes the app.
 * It exchanges the temporary token for permanent access tokens and stores them.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeTumblrToken } from '@/lib/social/tumblr/oauth';
import { createAuthenticatedTumblrClient } from '@/lib/social/tumblr/client';
import { encryptToken } from '@/lib/social/encryption';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');
    const denied = searchParams.get('denied');

    // Check if user denied access
    if (denied) {
      return NextResponse.redirect(
        new URL('/dashboard?tumblr_error=access_denied', request.url)
      );
    }

    // Validate required parameters
    if (!oauthToken || !oauthVerifier) {
      return NextResponse.redirect(
        new URL('/dashboard?tumblr_error=missing_parameters', request.url)
      );
    }

    // Retrieve stored temporary token and state from cookies
    const cookieStore = await cookies();
    const storedToken = cookieStore.get('tumblr_oauth_token')?.value;
    const storedTokenSecret = cookieStore.get('tumblr_oauth_token_secret')?.value;
    const storedUserId = cookieStore.get('tumblr_user_id')?.value;

    if (!storedToken || !storedTokenSecret || !storedUserId) {
      return NextResponse.redirect(
        new URL('/dashboard?tumblr_error=session_expired', request.url)
      );
    }

    // Verify token matches
    if (storedToken !== oauthToken) {
      return NextResponse.redirect(
        new URL('/dashboard?tumblr_error=token_mismatch', request.url)
      );
    }

    // Exchange temporary token for access token
    const { accessToken, accessTokenSecret } = await exchangeTumblrToken(
      oauthToken,
      storedTokenSecret,
      oauthVerifier
    );

    // Get user's blog information using the new access tokens
    const client = createAuthenticatedTumblrClient(accessToken, accessTokenSecret);
    const userInfo = await client.userInfo();

    // Get the primary blog (or first blog)
    const blogs = userInfo.user?.blogs || [];
    if (blogs.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard?tumblr_error=no_blogs', request.url)
      );
    }

    const primaryBlog = blogs.find((blog: any) => blog.primary) || blogs[0];

    // Encrypt tokens before storing
    const encryptedToken = encryptToken(accessToken);
    const encryptedTokenSecret = encryptToken(accessTokenSecret);

    // Store connection in database
    // Check if connection already exists
    const existingConnection = await prisma.socialMediaConnection.findFirst({
      where: {
        userId: storedUserId,
        platform: 'TUMBLR',
        tumblrBlogName: primaryBlog.name,
      },
    });

    if (existingConnection) {
      // Update existing connection
      await prisma.socialMediaConnection.update({
        where: { id: existingConnection.id },
        data: {
          tumblrOAuthToken: encryptedToken,
          tumblrOAuthSecret: encryptedTokenSecret,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new connection
      await prisma.socialMediaConnection.create({
        data: {
          userId: storedUserId,
          platform: 'TUMBLR',
          tumblrBlogName: primaryBlog.name,
          tumblrOAuthToken: encryptedToken,
          tumblrOAuthSecret: encryptedTokenSecret,
          isActive: true,
        },
      });
    }

    // Clear OAuth cookies
    cookieStore.delete('tumblr_oauth_token');
    cookieStore.delete('tumblr_oauth_token_secret');
    cookieStore.delete('tumblr_oauth_state');
    cookieStore.delete('tumblr_user_id');

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      new URL(`/dashboard?tumblr_success=connected&blog=${encodeURIComponent(primaryBlog.name)}`, request.url)
    );
  } catch (error: any) {
    console.error('Tumblr callback error:', error);

    // Clear OAuth cookies on error
    const cookieStore = await cookies();
    cookieStore.delete('tumblr_oauth_token');
    cookieStore.delete('tumblr_oauth_token_secret');
    cookieStore.delete('tumblr_oauth_state');
    cookieStore.delete('tumblr_user_id');

    return NextResponse.redirect(
      new URL('/dashboard?tumblr_error=authorization_failed', request.url)
    );
  }
}
