/**
 * Tumblr API client wrapper
 * Provides a typed interface to the tumblr.js library
 */

import tumblr from 'tumblr.js';
import type { TumblrOAuthCredentials, TumblrClient as ITumblrClient } from './types';
import { CONFIG } from '../../config';

/**
 * Create a Tumblr API client with OAuth credentials
 * @param credentials - OAuth credentials (consumer key/secret and optional token/secret)
 * @returns Configured Tumblr client
 */
export function createTumblrClient(credentials: TumblrOAuthCredentials): ITumblrClient {
  const { consumerKey, consumerSecret, token, tokenSecret } = credentials;

  if (!consumerKey || !consumerSecret) {
    throw new Error('Tumblr consumer key and secret are required');
  }

  const clientConfig: any = {
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
  };

  // Add user tokens if available (for authenticated requests)
  if (token && tokenSecret) {
    clientConfig.token = token;
    clientConfig.token_secret = tokenSecret;
  }

  return tumblr.createClient(clientConfig) as unknown as ITumblrClient;
}

/**
 * Create a read-only Tumblr client (no user authentication)
 * Useful for public API calls that don't require user authentication
 */
export function createPublicTumblrClient(): ITumblrClient {
  if (!CONFIG.TUMBLR.isConfigured()) {
    throw new Error('Tumblr API credentials not configured');
  }

  return createTumblrClient({
    consumerKey: CONFIG.TUMBLR.CONSUMER_KEY!,
    consumerSecret: CONFIG.TUMBLR.CONSUMER_SECRET!,
  });
}

/**
 * Create an authenticated Tumblr client for a specific user
 * @param token - User's OAuth token
 * @param tokenSecret - User's OAuth token secret
 */
export function createAuthenticatedTumblrClient(
  token: string,
  tokenSecret: string
): ITumblrClient {
  if (!CONFIG.TUMBLR.isConfigured()) {
    throw new Error('Tumblr API credentials not configured');
  }

  if (!token || !tokenSecret) {
    throw new Error('User OAuth tokens are required');
  }

  return createTumblrClient({
    consumerKey: CONFIG.TUMBLR.CONSUMER_KEY!,
    consumerSecret: CONFIG.TUMBLR.CONSUMER_SECRET!,
    token,
    tokenSecret,
  });
}

/**
 * Validate Tumblr API credentials by making a test request
 */
export async function validateTumblrCredentials(
  token: string,
  tokenSecret: string
): Promise<boolean> {
  try {
    const client = createAuthenticatedTumblrClient(token, tokenSecret);
    await client.userInfo();
    return true;
  } catch (error) {
    console.error('Tumblr credentials validation failed:', error);
    return false;
  }
}
