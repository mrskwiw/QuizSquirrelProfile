/**
 * Facebook OAuth Step 2: Handle Authorization Callback
 * GET /api/social/facebook/auth/callback?code=xxx&state=xxx
 *
 * Facebook redirects here after user authorizes the app.
 * Exchanges authorization code for access tokens and stores Page connections.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  validateState,
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getLongLivedPageToken,
  type FacebookPage,
} from '@/lib/social/facebook/oauth';
import { encryptToken } from '@/lib/social/encryption';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check if user denied permission
    if (error) {
      console.error('Facebook authorization error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=${encodeURIComponent(
          errorDescription || 'Facebook authorization was denied'
        )}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=Missing authorization code or state`
      );
    }

    // Retrieve stored state and user ID from cookies
    const cookieStore = await cookies();
    const storedState = cookieStore.get('facebook_oauth_state')?.value;
    const userId = cookieStore.get('facebook_user_id')?.value;

    // Validate state (CSRF protection)
    if (!storedState || !validateState(state, storedState)) {
      console.error('Facebook OAuth state mismatch');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=Invalid state parameter (CSRF check failed)`
      );
    }

    if (!userId) {
      console.error('Facebook OAuth user ID missing from cookies');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=User session expired`
      );
    }

    console.log('=== Facebook OAuth Callback ===');
    console.log('User ID:', userId);
    console.log('Code received:', code.substring(0, 20) + '...');

    // Exchange code for short-lived user access token
    const shortLivedToken = await exchangeCodeForToken(code);
    console.log('Short-lived token obtained');

    // Convert to long-lived user access token (60 days)
    const longLivedToken = await getLongLivedToken(shortLivedToken);
    console.log('Long-lived user token obtained');

    // Get user's Facebook Pages
    const pages = await getUserPages(longLivedToken);
    console.log(`Found ${pages.length} pages with posting permissions`);

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=${encodeURIComponent(
          'No Facebook Pages found with posting permissions. Please create a Facebook Page first.'
        )}`
      );
    }

    // Store each Page as a separate connection
    const connections = [];
    for (const page of pages) {
      console.log(`Processing page: ${page.name} (${page.id})`);

      // Get long-lived page access token (validate it)
      const pageLongLivedToken = await getLongLivedPageToken(page.access_token);

      // Encrypt tokens before storing
      const encryptedUserToken = encryptToken(longLivedToken);
      const encryptedPageToken = encryptToken(pageLongLivedToken);

      // Upsert connection (create or update if exists)
      const connection = await prisma.socialMediaConnection.upsert({
        where: {
          userId_platform_facebookPageId: {
            userId,
            platform: 'FACEBOOK',
            facebookPageId: page.id,
          },
        },
        update: {
          facebookPageName: page.name,
          facebookAccessToken: encryptedUserToken,
          facebookPageAccessToken: encryptedPageToken,
          isActive: true,
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          platform: 'FACEBOOK',
          facebookPageId: page.id,
          facebookPageName: page.name,
          facebookAccessToken: encryptedUserToken,
          facebookPageAccessToken: encryptedPageToken,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

      connections.push({
        id: connection.id,
        pageName: page.name,
        pageId: page.id,
      });

      console.log(`✓ Stored connection for page: ${page.name}`);
    }

    // Clear OAuth cookies
    cookieStore.delete('facebook_oauth_state');
    cookieStore.delete('facebook_user_id');

    console.log('=== Facebook OAuth Complete ===');
    console.log(`Successfully connected ${connections.length} page(s)`);

    // Redirect to success page with page names
    const pageNames = connections.map((c) => c.pageName).join(', ');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=${encodeURIComponent(
        `Successfully connected Facebook Page(s): ${pageNames}`
      )}`
    );
  } catch (error: any) {
    console.error('Facebook callback error:', error);

    // Clean up cookies on error
    try {
      const cookieStore = await cookies();
      cookieStore.delete('facebook_oauth_state');
      cookieStore.delete('facebook_user_id');
    } catch (e) {
      // Ignore cookie cleanup errors
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=${encodeURIComponent(
        error.message || 'Failed to connect Facebook Page'
      )}`
    );
  }
}
