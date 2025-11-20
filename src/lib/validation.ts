// Validation utilities for security and data integrity

/**
 * Password validation requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' }
  }

  return { isValid: true }
}

/**
 * Email validation (basic format check)
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  return { isValid: true }
}

/**
 * UUID validation
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Username validation
 * - 3-30 characters
 * - Alphanumeric and underscores only
 * - No spaces
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' }
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username must be no more than 30 characters' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }

  return { isValid: true }
}

/**
 * Sanitize string input to prevent XSS
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''

  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim()
}

/**
 * Sanitize HTML content (for rich text like bio, comments)
 * Allows basic formatting but removes dangerous elements
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '')

  return sanitized.trim()
}

/**
 * Validate quiz submission answers structure
 */
export function validateQuizAnswers(
  answers: Array<{ questionId: string; selectedOptionId?: string; answerValue?: string }>,
  validQuestionIds: string[],
  validOptionIds: Set<string>
): { isValid: boolean; error?: string } {
  if (!answers || !Array.isArray(answers)) {
    return { isValid: false, error: 'Answers must be an array' }
  }

  for (const answer of answers) {
    // Validate question ID exists in quiz
    if (!validQuestionIds.includes(answer.questionId)) {
      return {
        isValid: false,
        error: `Invalid question ID: ${answer.questionId}`
      }
    }

    // Validate option ID if provided
    if (answer.selectedOptionId && !validOptionIds.has(answer.selectedOptionId)) {
      return {
        isValid: false,
        error: `Invalid option ID: ${answer.selectedOptionId}`
      }
    }
  }

  return { isValid: true }
}

/**
 * Community name validation
 * - 3-50 characters
 * - Letters, numbers, spaces, and basic punctuation
 * - No leading/trailing spaces
 */
export function validateCommunityName(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: 'Community name is required' }
  }

  const trimmedName = name.trim()

  if (trimmedName !== name) {
    return { isValid: false, error: 'Community name cannot have leading or trailing spaces' }
  }

  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Community name must be at least 3 characters long' }
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Community name must be no more than 50 characters' }
  }

  // Allow letters, numbers, spaces, and basic punctuation
  if (!/^[a-zA-Z0-9\s\-_&!?.,']+$/.test(trimmedName)) {
    return { isValid: false, error: 'Community name contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Community description validation
 * - Maximum 500 characters
 * - Optional field
 */
export function validateCommunityDescription(description: string | null | undefined): { isValid: boolean; error?: string } {
  if (!description) {
    return { isValid: true } // Description is optional
  }

  if (description.length > 500) {
    return { isValid: false, error: 'Community description must be no more than 500 characters' }
  }

  return { isValid: true }
}
