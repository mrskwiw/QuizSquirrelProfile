/**
 * Shared types for social media integration
 */

export type SocialMediaPlatform = 'TUMBLR' | 'FACEBOOK';

export interface SocialMediaConnection {
  id: string;
  userId: string;
  platform: SocialMediaPlatform;

  // Tumblr fields
  tumblrBlogName?: string | null;
  tumblrOAuthToken?: string | null;
  tumblrOAuthSecret?: string | null;

  // Facebook fields
  facebookPageId?: string | null;
  facebookPageName?: string | null;
  facebookAccessToken?: string | null;
  facebookPageAccessToken?: string | null;

  // Common fields
  isActive: boolean;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialMediaPost {
  id: string;
  quizId: string;
  connectionId: string;
  platform: SocialMediaPlatform;
  externalPostId: string;
  externalUrl?: string | null;
  publishedAt: Date;
  lastSyncedAt?: Date | null;
  likes: number;
  shares: number;
  comments: number;
  views: number;
}

export interface QuizShareContent {
  title: string;
  description: string | null;
  coverImage: string | null;
  category: string;
  tags: string[];
  quizUrl: string;
  creatorName: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  platform: SocialMediaPlatform;
}

export interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  views: number;
  lastUpdated: Date;
}

// Error types
export const ERROR_MESSAGES = {
  TUMBLR_TOKEN_EXPIRED: 'Your Tumblr connection has expired. Please reconnect your account.',
  FACEBOOK_TOKEN_EXPIRED: 'Your Facebook connection has expired. Please reconnect your page.',
  RATE_LIMIT_EXCEEDED: 'You\'ve reached the posting limit. Please try again later.',
  NETWORK_ERROR: 'Unable to connect to social media. Please check your internet connection.',
  PLATFORM_ERROR: 'The social media platform returned an error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid social media credentials. Please reconnect your account.',
  POST_NOT_FOUND: 'The social media post was not found.',
  PERMISSION_DENIED: 'You don\'t have permission to publish to this account.',
  QUIZ_NOT_FOUND: 'Quiz not found or not accessible.',
  CONNECTION_NOT_FOUND: 'Social media connection not found.',
} as const;

export class SocialMediaError extends Error {
  constructor(
    message: string,
    public code?: keyof typeof ERROR_MESSAGES,
    public platform?: SocialMediaPlatform
  ) {
    super(message);
    this.name = 'SocialMediaError';
  }
}
