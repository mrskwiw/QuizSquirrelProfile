/**
 * Facebook Graph API Client
 * Abstraction layer for Facebook Graph API v22.0 calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SocialMediaError } from '../types';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Facebook post engagement metrics
 */
export interface FacebookEngagement {
  likes: number;
  shares: number;
  comments: number;
}

/**
 * Facebook post data for creating a link post
 */
export interface FacebookPostData {
  message: string;
  link: string;
  picture?: string;
}

/**
 * Create authenticated Facebook Graph API client
 * @param pageAccessToken - Long-lived page access token
 * @returns Axios instance configured for Graph API
 */
export function createGraphAPIClient(pageAccessToken: string): AxiosInstance {
  if (!pageAccessToken) {
    throw new Error('Page access token is required');
  }

  return axios.create({
    baseURL: GRAPH_API_BASE,
    params: {
      access_token: pageAccessToken,
    },
    timeout: 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle Facebook Graph API errors
 * @param error - Axios error from Graph API
 */
function handleGraphAPIError(error: any): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const errorData = axiosError.response?.data as any;

    // Facebook-specific error handling
    if (errorData?.error) {
      const fbError = errorData.error;

      // Rate limiting
      if (fbError.code === 4 || fbError.code === 17 || fbError.code === 32) {
        throw new SocialMediaError(
          'Facebook rate limit exceeded. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          'FACEBOOK'
        );
      }

      // Invalid or expired token
      if (fbError.code === 190) {
        throw new SocialMediaError(
          'Facebook access token expired or invalid. Please reconnect your Facebook Page.',
          'FACEBOOK_TOKEN_EXPIRED',
          'FACEBOOK'
        );
      }

      // Permission error
      if (fbError.code === 200 || fbError.code === 10) {
        throw new SocialMediaError(
          'Insufficient permissions to post to this Facebook Page.',
          'PERMISSION_DENIED',
          'FACEBOOK'
        );
      }

      // Generic Facebook error
      throw new SocialMediaError(
        fbError.message || 'Facebook API error',
        fbError.type || 'API_ERROR',
        'FACEBOOK'
      );
    }
  }

  // Network or other error
  throw new SocialMediaError(
    error.message || 'Failed to communicate with Facebook',
    'NETWORK_ERROR',
    'FACEBOOK'
  );
}

/**
 * Publish a link post to a Facebook Page
 * @param pageId - Facebook Page ID
 * @param pageAccessToken - Page access token
 * @param postData - Post content (message, link, optional image)
 * @returns Post ID from Facebook
 */
export async function publishPost(
  pageId: string,
  pageAccessToken: string,
  postData: FacebookPostData
): Promise<{ id: string }> {
  try {
    const client = createGraphAPIClient(pageAccessToken);

    const response = await client.post(`/${pageId}/feed`, postData);

    if (!response.data.id) {
      throw new Error('No post ID in Facebook response');
    }

    return { id: response.data.id };
  } catch (error: any) {
    console.error('Facebook publish error:', error.response?.data || error.message);
    handleGraphAPIError(error);
  }
}

/**
 * Get Facebook Page information
 * @param pageId - Facebook Page ID
 * @param pageAccessToken - Page access token
 * @returns Page information
 */
export async function getPageInfo(
  pageId: string,
  pageAccessToken: string
): Promise<{ id: string; name: string; category?: string }> {
  try {
    const client = createGraphAPIClient(pageAccessToken);

    const response = await client.get(`/${pageId}`, {
      params: {
        fields: 'id,name,category',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Facebook page info error:', error.response?.data || error.message);
    handleGraphAPIError(error);
  }
}

/**
 * Delete a post from Facebook Page
 * @param postId - Facebook post ID (format: pageId_postId)
 * @param pageAccessToken - Page access token
 * @returns Success status
 */
export async function deletePost(
  postId: string,
  pageAccessToken: string
): Promise<boolean> {
  try {
    const client = createGraphAPIClient(pageAccessToken);

    const response = await client.delete(`/${postId}`);

    return response.data.success === true;
  } catch (error: any) {
    console.error('Facebook delete error:', error.response?.data || error.message);
    handleGraphAPIError(error);
  }
}

/**
 * Get post engagement metrics (likes, shares, comments)
 * @param postId - Facebook post ID
 * @param pageAccessToken - Page access token
 * @returns Engagement metrics
 */
export async function getPostEngagement(
  postId: string,
  pageAccessToken: string
): Promise<FacebookEngagement> {
  try {
    const client = createGraphAPIClient(pageAccessToken);

    const response = await client.get(`/${postId}`, {
      params: {
        fields: 'likes.summary(true),shares,comments.summary(true)',
      },
    });

    const data = response.data;

    return {
      likes: data.likes?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      comments: data.comments?.summary?.total_count || 0,
    };
  } catch (error: any) {
    console.error('Facebook engagement error:', error.response?.data || error.message);

    // If post doesn't exist or is deleted, return zeros
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { likes: 0, shares: 0, comments: 0 };
    }

    handleGraphAPIError(error);
  }
}

/**
 * Validate that a page access token is valid and has required permissions
 * @param pageAccessToken - Page access token to validate
 * @returns True if valid, throws error otherwise
 */
export async function validatePageToken(pageAccessToken: string): Promise<boolean> {
  try {
    const client = createGraphAPIClient(pageAccessToken);

    // Try to get the page info to validate token
    const response = await client.get('/me', {
      params: {
        fields: 'id,name',
      },
    });

    return !!response.data.id;
  } catch (error: any) {
    console.error('Facebook token validation error:', error.response?.data || error.message);
    handleGraphAPIError(error);
  }
}

/**
 * Get Page insights (analytics)
 * Useful for tracking quiz post performance over time
 * @param pageId - Facebook Page ID
 * @param pageAccessToken - Page access token
 * @param metrics - Array of metric names to fetch
 * @returns Insights data
 */
export async function getPageInsights(
  pageId: string,
  pageAccessToken: string,
  metrics: string[] = ['page_impressions', 'page_engaged_users']
): Promise<any> {
  try {
    const client = createGraphAPIClient(pageAccessToken);

    const response = await client.get(`/${pageId}/insights`, {
      params: {
        metric: metrics.join(','),
        period: 'day',
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error('Facebook insights error:', error.response?.data || error.message);
    // Insights require additional permissions, so don't throw if unavailable
    return [];
  }
}
