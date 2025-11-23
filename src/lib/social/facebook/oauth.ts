/**
 * Facebook OAuth 2.0 Helpers
 * Handles Facebook OAuth authorization flow for posting to Facebook Pages
 */

import axios from 'axios';
import { randomBytes } from 'crypto';
import { CONFIG } from '../../config';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Facebook Page interface
 */
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
}

/**
 * Generate OAuth state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate OAuth state parameter
 */
export function validateState(providedState: string, storedState: string): boolean {
  if (!providedState || !storedState) {
    return false;
  }
  return providedState === storedState;
}

/**
 * Generate Facebook authorization URL
 * @param state - CSRF protection state
 * @returns Authorization URL to redirect user to
 */
export function generateFacebookAuthUrl(state: string): string {
  if (!CONFIG.FACEBOOK.isConfigured()) {
    throw new Error('Facebook API credentials not configured');
  }

  const appId = CONFIG.FACEBOOK.APP_ID!;
  const callbackUrl = CONFIG.FACEBOOK.CALLBACK_URL!;

  // Scopes required for posting to Facebook Pages
  const scopes = [
    'pages_show_list',        // See list of Pages user manages
    'pages_read_engagement',  // Read engagement data from Pages
    'pages_manage_posts',     // Create, edit and delete posts on Pages
  ];

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: callbackUrl,
    state: state,
    scope: scopes.join(','),
    response_type: 'code',
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for user access token
 * @param code - Authorization code from Facebook callback
 * @returns Short-lived user access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!CONFIG.FACEBOOK.isConfigured()) {
    throw new Error('Facebook app credentials not configured');
  }

  const appId = CONFIG.FACEBOOK.APP_ID!;
  const appSecret = CONFIG.FACEBOOK.APP_SECRET!;
  const callbackUrl = CONFIG.FACEBOOK.CALLBACK_URL!;

  try {
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: callbackUrl,
      code: code,
    });

    const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`);

    if (!response.data.access_token) {
      throw new Error('No access token in Facebook response');
    }

    return response.data.access_token;
  } catch (error: any) {
    console.error('Facebook token exchange error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to exchange code for token');
  }
}

/**
 * Convert short-lived token to long-lived token (60 days)
 * @param shortLivedToken - Short-lived user access token
 * @returns Long-lived user access token
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  if (!CONFIG.FACEBOOK.isConfigured()) {
    throw new Error('Facebook app credentials not configured');
  }

  const appId = CONFIG.FACEBOOK.APP_ID!;
  const appSecret = CONFIG.FACEBOOK.APP_SECRET!;

  try {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`);

    if (!response.data.access_token) {
      throw new Error('No long-lived token in Facebook response');
    }

    return response.data.access_token;
  } catch (error: any) {
    console.error('Facebook long-lived token error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to get long-lived token');
  }
}

/**
 * Get user's Facebook Pages
 * @param userAccessToken - User access token
 * @returns Array of Pages user manages
 */
export async function getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
      params: {
        access_token: userAccessToken,
        fields: 'id,name,access_token,category,tasks',
      },
    });

    if (!response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid response from Facebook Pages API');
    }

    // Filter to only pages where user has MANAGE or CREATE_CONTENT permission
    const pages = response.data.data.filter((page: FacebookPage) => {
      const tasks = page.tasks || [];
      return tasks.includes('MANAGE') || tasks.includes('CREATE_CONTENT');
    });

    if (pages.length === 0) {
      throw new Error('No Pages found with posting permissions. Please create a Facebook Page first.');
    }

    return pages;
  } catch (error: any) {
    console.error('Facebook Pages fetch error:', error.response?.data || error.message);

    if (error.message.includes('No Pages found')) {
      throw error;
    }

    throw new Error(error.response?.data?.error?.message || 'Failed to fetch Facebook Pages');
  }
}

/**
 * Get long-lived Page access token
 * Page tokens don't expire as long as they're used at least once every 60 days
 * @param pageAccessToken - Page access token from getUserPages
 * @returns Long-lived page access token (same as input, but validated)
 */
export async function getLongLivedPageToken(pageAccessToken: string): Promise<string> {
  // Page access tokens from /me/accounts are already long-lived
  // They don't expire as long as they're used within 60 days
  // We just validate that the token is valid
  try {
    await axios.get(`${GRAPH_API_BASE}/me`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,name',
      },
    });

    return pageAccessToken;
  } catch (error: any) {
    console.error('Facebook page token validation error:', error.response?.data || error.message);
    throw new Error('Invalid page access token');
  }
}

/**
 * Validate access token and get token info
 * Useful for debugging and checking token expiration
 */
export async function debugToken(accessToken: string): Promise<any> {
  if (!CONFIG.FACEBOOK.isConfigured()) {
    throw new Error('Facebook app credentials not configured');
  }

  const appId = CONFIG.FACEBOOK.APP_ID!;
  const appSecret = CONFIG.FACEBOOK.APP_SECRET!;

  try {
    const appAccessToken = `${appId}|${appSecret}`;
    const response = await axios.get(`${GRAPH_API_BASE}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: appAccessToken,
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error('Facebook token debug error:', error.response?.data || error.message);
    throw new Error('Failed to debug token');
  }
}
