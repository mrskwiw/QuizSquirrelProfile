import { MAX_MESSAGE_LENGTH } from '@/types/messages'

/**
 * Validation errors
 */
export class MessageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MessageValidationError'
  }
}

/**
 * Validate message content
 */
export function validateMessageContent(content: string): void {
  if (!content || typeof content !== 'string') {
    throw new MessageValidationError('Message content is required')
  }

  const trimmedContent = content.trim()

  if (trimmedContent.length === 0) {
    throw new MessageValidationError('Message content cannot be empty')
  }

  if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
    throw new MessageValidationError(
      `Message content cannot exceed ${MAX_MESSAGE_LENGTH} characters`
    )
  }
}

/**
 * Sanitize message content to prevent XSS attacks
 */
export function sanitizeMessageContent(content: string): string {
  return content
    .trim()
    // Remove any null bytes
    .replace(/\0/g, '')
    // Normalize whitespace but preserve line breaks
    .replace(/[\t\r ]+/g, ' ')
    // Remove any potentially dangerous unicode characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
}

/**
 * Validate conversation ID (UUID format)
 */
export function validateConversationId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new MessageValidationError('Conversation ID is required')
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new MessageValidationError('Invalid conversation ID format')
  }
}

/**
 * Validate user ID (UUID format)
 */
export function validateUserId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new MessageValidationError('User ID is required')
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new MessageValidationError('Invalid user ID format')
  }
}

/**
 * Validate message ID (UUID format)
 */
export function validateMessageId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new MessageValidationError('Message ID is required')
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new MessageValidationError('Invalid message ID format')
  }
}

/**
 * Validate content type
 */
export function validateContentType(contentType: string): void {
  const validTypes = ['text', 'image', 'quiz_link']

  if (!validTypes.includes(contentType)) {
    throw new MessageValidationError(
      `Invalid content type. Must be one of: ${validTypes.join(', ')}`
    )
  }
}

/**
 * Detect potential spam patterns
 */
export function detectSpam(content: string): boolean {
  const spamPatterns = [
    // Excessive repetition of same character
    /(.)\1{20,}/,
    // Too many URLs
    /(https?:\/\/[^\s]+){5,}/,
    // Common spam phrases
    /\b(click here|buy now|limited time|act now)\b/gi,
    // Excessive capitalization
    /[A-Z]{50,}/,
    // Excessive special characters
    /[!@#$%^&*()]{20,}/,
  ]

  return spamPatterns.some(pattern => pattern.test(content))
}

/**
 * Extract URLs from message content
 */
export function extractUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = content.match(urlRegex)
  return matches || []
}

/**
 * Check if message contains Quiz Squirrel quiz link
 */
export function isQuizLink(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    // Match /quiz/[id] pattern
    return /^\/quiz\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      parsedUrl.pathname
    )
  } catch {
    return false
  }
}

/**
 * Extract quiz ID from Quiz Squirrel link
 */
export function extractQuizId(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const match = parsedUrl.pathname.match(
      /^\/quiz\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
    )
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(limit?: number, before?: string): void {
  if (limit !== undefined) {
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      throw new MessageValidationError('Limit must be between 1 and 100')
    }
  }

  if (before !== undefined) {
    validateConversationId(before) // Reuse UUID validation
  }
}

/**
 * Rate limiting check
 */
export interface RateLimitInfo {
  count: number
  resetAt: Date
}

export function checkRateLimit(
  userId: string,
  rateLimitMap: Map<string, RateLimitInfo>,
  maxMessages: number = 50,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): boolean {
  const now = new Date()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    // Create new rate limit window
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
    })
    return true
  }

  if (userLimit.count >= maxMessages) {
    return false // Rate limit exceeded
  }

  // Increment count
  userLimit.count++
  return true
}
