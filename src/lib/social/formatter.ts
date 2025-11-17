/**
 * Content formatter for social media posts
 * Formats Quiz Squirrel quizzes for different platforms
 */

import type { QuizShareContent } from './types';

/**
 * Generate the public URL for a quiz
 */
export function generateQuizUrl(quizId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/quiz/${quizId}`;
}

/**
 * Format quiz content for Tumblr
 * Tumblr supports HTML in text posts
 */
export function formatQuizForTumblr(content: QuizShareContent) {
  const { title, description, coverImage, tags, quizUrl, creatorName } = content;

  // Build HTML content
  let body = `<h2>${escapeHtml(title)}</h2>\n\n`;

  if (description) {
    body += `<p>${escapeHtml(description)}</p>\n\n`;
  }

  body += `<p><strong>Take the quiz:</strong> <a href="${quizUrl}">${quizUrl}</a></p>\n\n`;
  body += `<p><em>Created by ${escapeHtml(creatorName)} on Quiz Squirrel</em></p>`;

  // Tumblr tags (clean and lowercase)
  const tumblrTags = [
    ...tags.map(t => cleanTag(t)),
    'quiz',
    'personality quiz',
    'quizsquirrel',
    content.category.toLowerCase(),
  ];

  // Decide post type based on whether there's a cover image
  if (coverImage) {
    return {
      type: 'photo',
      data: coverImage, // Can be URL or file path
      caption: body,
      tags: tumblrTags.join(','),
      state: 'published',
    };
  } else {
    return {
      type: 'text',
      title: title,
      body: body,
      tags: tumblrTags.join(','),
      state: 'published',
    };
  }
}

/**
 * Format quiz content for Facebook
 * Facebook Page posts are simpler - message + link
 */
export function formatQuizForFacebook(content: QuizShareContent) {
  const { title, description, quizUrl, creatorName } = content;

  // Build message text
  let message = `${title}\n\n`;

  if (description) {
    // Limit description to 200 chars for Facebook
    const shortDesc = description.length > 200
      ? description.substring(0, 197) + '...'
      : description;
    message += `${shortDesc}\n\n`;
  }

  message += `Take the quiz: ${quizUrl}\n\n`;
  message += `Created by ${creatorName} on Quiz Squirrel`;

  // Facebook post object
  const post: any = {
    message: message,
    link: quizUrl,
  };

  // If there's a cover image, include it
  if (content.coverImage) {
    post.picture = content.coverImage;
  }

  return post;
}

/**
 * Clean and validate tags for social media
 */
function cleanTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50); // Limit length
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate attribution text for when users share others' quizzes
 */
export function generateAttributionText(creatorName: string, sharerName?: string): string {
  if (sharerName && sharerName !== creatorName) {
    return `Shared by @${sharerName} | Created by @${creatorName}`;
  }
  return `Created by @${creatorName}`;
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
