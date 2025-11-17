/**
 * Tumblr OAuth 1.0a authentication flow
 *
 * OAuth 1.0 Flow:
 * 1. Request temporary token from Tumblr
 * 2. Redirect user to Tumblr authorization page
 * 3. User authorizes the app
 * 4. Tumblr redirects back with verifier
 * 5. Exchange temporary token + verifier for permanent access token
 */

import crypto from 'crypto';
import { SocialMediaError } from '../types';

// OAuth endpoints
const TUMBLR_REQUEST_TOKEN_URL = 'https://www.tumblr.com/oauth/request_token';
const TUMBLR_AUTHORIZE_URL = 'https://www.tumblr.com/oauth/authorize';
const TUMBLR_ACCESS_TOKEN_URL = 'https://www.tumblr.com/oauth/access_token';

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate OAuth signature base string
 * This is used for OAuth 1.0 request signing
 */
function generateSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');
}

/**
 * Generate OAuth signature using HMAC-SHA1
 */
function generateOAuthSignature(
  baseString: string,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmac = crypto.createHmac('sha1', signingKey);
  hmac.update(baseString);
  return hmac.digest('base64');
}

/**
 * Generate OAuth authorization header
 */
function generateOAuthHeader(params: Record<string, string>): string {
  const headerParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
    .join(', ');

  return `OAuth ${headerParams}`;
}

/**
 * Step 1: Request temporary token from Tumblr
 * Returns: { oauth_token, oauth_token_secret, oauth_callback_confirmed }
 */
export async function requestTumblrToken(callbackUrl: string): Promise<{
  oauthToken: string;
  oauthTokenSecret: string;
  oauthCallbackConfirmed: string;
}> {
  const consumerKey = process.env.TUMBLR_CONSUMER_KEY;
  const consumerSecret = process.env.TUMBLR_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new SocialMediaError(
      'Tumblr API credentials not configured',
      'INVALID_CREDENTIALS',
      'TUMBLR'
    );
  }

  // OAuth parameters
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_callback: callbackUrl,
  };

  // Generate signature
  const baseString = generateSignatureBaseString(
    'POST',
    TUMBLR_REQUEST_TOKEN_URL,
    oauthParams
  );
  const signature = generateOAuthSignature(baseString, consumerSecret);
  oauthParams.oauth_signature = signature;

  // Make request
  try {
    const response = await fetch(TUMBLR_REQUEST_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': generateOAuthHeader(oauthParams),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tumblr request token failed: ${response.status} - ${text}`);
    }

    const body = await response.text();
    const params = new URLSearchParams(body);

    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');
    const oauthCallbackConfirmed = params.get('oauth_callback_confirmed');

    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('Invalid response from Tumblr: missing tokens');
    }

    return {
      oauthToken,
      oauthTokenSecret,
      oauthCallbackConfirmed: oauthCallbackConfirmed || 'false',
    };
  } catch (error) {
    console.error('Tumblr request token error:', error);
    throw new SocialMediaError(
      'Failed to request Tumblr authorization',
      'PLATFORM_ERROR',
      'TUMBLR'
    );
  }
}

/**
 * Step 2: Get Tumblr authorization URL
 * User should be redirected to this URL to authorize the app
 */
export function getTumblrAuthorizationUrl(oauthToken: string): string {
  return `${TUMBLR_AUTHORIZE_URL}?oauth_token=${encodeURIComponent(oauthToken)}`;
}

/**
 * Step 3: Exchange temporary token for permanent access token
 * Called after user authorizes and Tumblr redirects back
 */
export async function exchangeTumblrToken(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<{
  accessToken: string;
  accessTokenSecret: string;
}> {
  const consumerKey = process.env.TUMBLR_CONSUMER_KEY;
  const consumerSecret = process.env.TUMBLR_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new SocialMediaError(
      'Tumblr API credentials not configured',
      'INVALID_CREDENTIALS',
      'TUMBLR'
    );
  }

  // OAuth parameters
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_token: oauthToken,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_verifier: oauthVerifier,
  };

  // Generate signature (now includes token secret)
  const baseString = generateSignatureBaseString(
    'POST',
    TUMBLR_ACCESS_TOKEN_URL,
    oauthParams
  );
  const signature = generateOAuthSignature(baseString, consumerSecret, oauthTokenSecret);
  oauthParams.oauth_signature = signature;

  // Make request
  try {
    const response = await fetch(TUMBLR_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': generateOAuthHeader(oauthParams),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tumblr access token failed: ${response.status} - ${text}`);
    }

    const body = await response.text();
    const params = new URLSearchParams(body);

    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Invalid response from Tumblr: missing access tokens');
    }

    return {
      accessToken,
      accessTokenSecret,
    };
  } catch (error) {
    console.error('Tumblr access token error:', error);
    throw new SocialMediaError(
      'Failed to complete Tumblr authorization',
      'PLATFORM_ERROR',
      'TUMBLR'
    );
  }
}

/**
 * Complete OAuth flow helper
 * Combines all three steps for easier use
 */
export async function completeTumblrOAuth(
  callbackUrl: string,
  oauthVerifier: string,
  temporaryToken: string,
  temporaryTokenSecret: string
): Promise<{
  accessToken: string;
  accessTokenSecret: string;
}> {
  return await exchangeTumblrToken(
    temporaryToken,
    temporaryTokenSecret,
    oauthVerifier
  );
}

/**
 * Validate OAuth state parameter to prevent CSRF attacks
 */
export function validateOAuthState(
  receivedState: string,
  expectedState: string
): boolean {
  if (!receivedState || !expectedState) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedState),
    Buffer.from(expectedState)
  );
}
