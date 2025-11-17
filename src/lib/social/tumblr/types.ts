/**
 * Tumblr-specific types
 */

export interface TumblrOAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  token?: string;
  tokenSecret?: string;
}

export interface TumblrBlog {
  name: string;
  title: string;
  description: string;
  url: string;
  posts: number;
  updated: number;
}

export interface TumblrPost {
  id: string;
  type: string;
  blog_name: string;
  post_url: string;
  timestamp: number;
  note_count: number; // Total engagement (likes + reblogs)
}

export interface TumblrPostStats {
  likes: number;
  reblogs: number;
  notes: number; // Total (likes + reblogs)
}

export interface TumblrCreatePostOptions {
  type: 'text' | 'photo' | 'quote' | 'link';
  state?: 'published' | 'draft' | 'queue';
  tags?: string;
  title?: string;
  body?: string;
  caption?: string;
  data?: string | Buffer; // For photo posts
}

export interface TumblrClient {
  blogInfo(blogName: string): Promise<any>;
  blogPosts(blogName: string, options?: any): Promise<any>;
  createPost(blogName: string, options: TumblrCreatePostOptions): Promise<any>;
  editPost(blogName: string, postId: string, options: any): Promise<any>;
  deletePost(blogName: string, postId: string): Promise<any>;
  userInfo(): Promise<any>;
}
