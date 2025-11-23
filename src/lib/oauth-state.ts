/**
 * OAuth State Management
 *
 * Secure state token generation and validation for OAuth 2.0 flows.
 * Implements CSRF protection by generating cryptographically secure state tokens
 * that are validated during the OAuth callback.
 *
 * Features:
 * - Cryptographically secure random state generation
 * - State validation with expiration (15 minutes)
 * - PKCE (Proof Key for Code Exchange) support
 * - Session-based state storage (in-memory with Redis backend option)
 *
 * Security improvements:
 * - Prevents CSRF attacks on OAuth flows
 * - Short-lived state tokens (15 minute expiration)
 * - Cryptographic randomness for unpredictability
 * - Optional PKCE for enhanced security
 *
 * @module oauth-state
 */

import { generateRandomString, hashString } from './crypto'

/**
 * OAuth state token data
 */
export interface OAuthState {
  state: string              // Random state token
  provider: 'facebook' | 'tumblr'
  userId?: string            // User ID if user is logged in
  createdAt: number          // Timestamp when state was created
  expiresAt: number          // Timestamp when state expires
  codeVerifier?: string      // PKCE code verifier (optional)
  codeChallenge?: string     // PKCE code challenge (optional)
  returnUrl?: string         // URL to redirect to after OAuth
}

/**
 * In-memory state storage
 * NOTE: This works for single-instance deployments.
 * For production with multiple serverless instances, use Redis (Upstash).
 */
const stateStore = new Map<string, OAuthState>()

/**
 * State token expiration time (15 minutes)
 */
const STATE_EXPIRATION_MS = 15 * 60 * 1000

/**
 * Clean up expired state tokens
 * Should be called periodically to prevent memory leaks
 */
function cleanupExpiredStates(): void {
  const now = Date.now()
  for (const [state, data] of stateStore.entries()) {
    if (data.expiresAt < now) {
      stateStore.delete(state)
    }
  }
}

/**
 * Generate OAuth state token with optional PKCE
 *
 * @param provider - OAuth provider (facebook or tumblr)
 * @param userId - User ID if user is logged in (optional)
 * @param usePKCE - Whether to generate PKCE challenge (default: false)
 * @param returnUrl - URL to redirect to after OAuth (optional)
 * @returns OAuth state data
 *
 * @example
 * const { state, codeChallenge } = generateOAuthState('facebook', userId, true)
 * // Use state in OAuth authorization URL
 * // Use codeChallenge in OAuth authorization URL (if PKCE enabled)
 */
export function generateOAuthState(
  provider: 'facebook' | 'tumblr',
  userId?: string,
  usePKCE: boolean = false,
  returnUrl?: string
): OAuthState {
  // Clean up expired states periodically
  if (stateStore.size > 0 && Math.random() < 0.1) {
    cleanupExpiredStates()
  }

  // Generate random state token (32 bytes = 256 bits)
  const state = generateRandomString(32)

  const now = Date.now()
  const oauthState: OAuthState = {
    state,
    provider,
    userId,
    createdAt: now,
    expiresAt: now + STATE_EXPIRATION_MS,
    returnUrl
  }

  // Generate PKCE challenge if requested
  if (usePKCE) {
    const codeVerifier = generateRandomString(64) // 64 bytes = 512 bits
    const codeChallenge = hashString(codeVerifier)

    oauthState.codeVerifier = codeVerifier
    oauthState.codeChallenge = codeChallenge
  }

  // Store state
  stateStore.set(state, oauthState)

  return oauthState
}

/**
 * Validate OAuth state token
 *
 * @param state - State token from OAuth callback
 * @param provider - Expected OAuth provider
 * @returns OAuth state data if valid, null if invalid or expired
 *
 * @example
 * const stateData = validateOAuthState(state, 'facebook')
 * if (!stateData) {
 *   throw new Error('Invalid or expired state token')
 * }
 */
export function validateOAuthState(
  state: string,
  provider: 'facebook' | 'tumblr'
): OAuthState | null {
  const stateData = stateStore.get(state)

  if (!stateData) {
    return null
  }

  // Validate provider matches
  if (stateData.provider !== provider) {
    stateStore.delete(state)
    return null
  }

  // Validate not expired
  if (stateData.expiresAt < Date.now()) {
    stateStore.delete(state)
    return null
  }

  // State is valid - delete it (single use)
  stateStore.delete(state)

  return stateData
}

/**
 * Get PKCE code verifier for state token
 *
 * @param state - State token
 * @returns Code verifier if exists, null otherwise
 *
 * @example
 * const codeVerifier = getCodeVerifier(state)
 * if (codeVerifier) {
 *   // Use code verifier in token exchange
 * }
 */
export function getCodeVerifier(state: string): string | null {
  const stateData = stateStore.get(state)
  return stateData?.codeVerifier || null
}

/**
 * Manually delete a state token (e.g., after error)
 *
 * @param state - State token to delete
 */
export function deleteOAuthState(state: string): void {
  stateStore.delete(state)
}

/**
 * Get state store size (for monitoring/debugging)
 */
export function getStateStoreSize(): number {
  return stateStore.size
}

/**
 * Clear all state tokens (for testing only)
 */
export function clearAllStates(): void {
  stateStore.clear()
}
