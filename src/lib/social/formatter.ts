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
 * Count Unicode code points correctly (NPF requirement)
 * Standard emojis = 1 code point, complex emojis = multiple code points
 */
function getCodePointLength(text: string): number {
  return [...text].length;
}

/**
 * Format quiz content for Tumblr using NPF (Neue Post Format)
 * Creates rich media posts with images, formatted text, and interactive polls
 */
export function formatQuizForTumblr(content: QuizShareContent) {
  const { title, description, coverImage, tags, quizUrl, creatorName, questions } = content;

  // Build content blocks array for NPF
  const contentBlocks: any[] = [];

  // 1. Header with quiz title
  const titleText = `🎯 ${title}`;
  contentBlocks.push({
    type: 'text',
    text: titleText,
    subtype: 'heading1',
  });

  // 2. Cover image if available
  if (coverImage) {
    contentBlocks.push({
      type: 'image',
      media: [
        {
          type: 'image/jpeg',
          url: coverImage,
        },
      ],
    });
  }

  // 3. Description if available
  if (description) {
    contentBlocks.push({
      type: 'text',
      text: description,
    });
  }

  // 4. Question previews - show first question with clickable answers
  if (questions && questions.length > 0) {
    const firstQuestion = questions[0];
    const questionText = `❓ ${firstQuestion.text}`;

    contentBlocks.push({
      type: 'text',
      text: questionText,
      subtype: 'heading2',
    });

    // Make answer options clickable
    if (firstQuestion.options && firstQuestion.options.length > 0) {
      firstQuestion.options.forEach((option) => {
        const optionText = `→ ${option.text}`;
        contentBlocks.push({
          type: 'text',
          text: optionText,
          formatting: [
            {
              start: 0,
              end: getCodePointLength(optionText),
              type: 'link',
              url: quizUrl,
            },
          ],
        });
      });

      // Hint text
      const hintText = '(Click any answer to start the quiz!)';
      contentBlocks.push({
        type: 'text',
        text: hintText,
        formatting: [
          {
            start: 0,
            end: getCodePointLength(hintText),
            type: 'italic',
          },
        ],
      });
    }

    // More questions indicator
    if (questions.length > 1) {
      contentBlocks.push({
        type: 'text',
        text: `Plus ${questions.length - 1} more question${questions.length > 2 ? 's' : ''}...`,
        subtype: 'heading2',
      });
    }
  }

  // 5. Call to action with link and bold
  const ctaText = '👉 Take the full quiz and discover your results!';
  const ctaLen = getCodePointLength(ctaText);
  contentBlocks.push({
    type: 'text',
    text: ctaText,
    formatting: [
      {
        start: 0,
        end: ctaLen,
        type: 'link',
        url: quizUrl,
      },
      {
        start: 0,
        end: ctaLen,
        type: 'bold',
      },
    ],
  });

  // Link card
  contentBlocks.push({
    type: 'link',
    url: quizUrl,
    title: '🎯 Start Quiz',
    description: `Click here to take the full ${title} quiz on Quiz Squirrel`,
  });

  // 6. Attribution
  const attrText = `✨ ${creatorName} on Quiz Squirrel`;
  const attrLen = getCodePointLength(attrText);
  contentBlocks.push({
    type: 'text',
    text: attrText,
    formatting: [
      {
        start: 0,
        end: attrLen,
        type: 'italic',
      },
    ],
  });

  // Tumblr tags (clean and lowercase)
  const tumblrTags = (tags || []).map(t => cleanTag(t));
  tumblrTags.push('quiz', 'personality quiz', 'quizsquirrel', content.category.toLowerCase());

  // NPF format for modern Tumblr API
  return {
    type: 'text' as const,
    content: contentBlocks,
    tags: tumblrTags.join(','),
    state: 'published' as const,
  };
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
