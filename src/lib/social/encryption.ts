/**
 * Encryption utilities for securing OAuth tokens in the database
 *
 * This module provides a clean interface for token encryption/decryption,
 * wrapping the underlying crypto implementation for social media integrations.
 *
 * Uses AES-256-GCM (authenticated encryption) via src/lib/crypto.ts
 */

import { encrypt, decrypt, validateEncryption as validateCrypto } from '../crypto'
import { logSocialTokenOperation } from '../security-logger'

/**
 * Encrypt a token using AES-256-GCM encryption
 *
 * @param token - The plaintext token to encrypt
 * @param userId - User ID for audit logging (optional)
 * @param provider - Social provider for audit logging (optional)
 * @returns Encrypted token as a base64 string
 * @throws Error if ENCRYPTION_KEY is not set or encryption fails
 *
 * @example
 * const encrypted = encryptToken('facebook-oauth-token-xyz', userId, 'facebook')
 * // Store encrypted in database
 */
export function encryptToken(token: string, userId?: string, provider?: 'facebook' | 'tumblr'): string {
  if (!token || token.trim() === '') {
    throw new Error('Token cannot be empty')
  }

  try {
    const encrypted = encrypt(token)

    // Log encryption operation (non-blocking)
    if (userId && provider) {
      logSocialTokenOperation({
        userId,
        operation: 'encrypt',
        provider,
        success: true
      }).catch(err => console.error('Failed to log token encryption:', err))
    }

    return encrypted
  } catch (error) {
    console.error('Token encryption error:', error)

    // Log encryption failure
    if (userId && provider) {
      logSocialTokenOperation({
        userId,
        operation: 'encrypt',
        provider,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }).catch(err => console.error('Failed to log token encryption error:', err))
    }

    throw new Error('Failed to encrypt token')
  }
}

/**
 * Decrypt an encrypted token
 *
 * @param encryptedToken - The encrypted token to decrypt
 * @param userId - User ID for audit logging (optional)
 * @param provider - Social provider for audit logging (optional)
 * @returns Decrypted plaintext token
 * @throws Error if decryption fails, authentication tag is invalid, or key is wrong
 *
 * @example
 * const decrypted = decryptToken(user.facebookAccessTokenEnc!, userId, 'facebook')
 * // Use decrypted token for API calls
 */
export function decryptToken(encryptedToken: string, userId?: string, provider?: 'facebook' | 'tumblr'): string {
  if (!encryptedToken || encryptedToken.trim() === '') {
    throw new Error('Encrypted token cannot be empty')
  }

  try {
    const decrypted = decrypt(encryptedToken)

    // Log decryption operation (non-blocking)
    if (userId && provider) {
      logSocialTokenOperation({
        userId,
        operation: 'decrypt',
        provider,
        success: true
      }).catch(err => console.error('Failed to log token decryption:', err))
    }

    return decrypted
  } catch (error) {
    console.error('Token decryption error:', error)

    // Log decryption failure
    if (userId && provider) {
      logSocialTokenOperation({
        userId,
        operation: 'decrypt',
        provider,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }).catch(err => console.error('Failed to log token decryption error:', err))
    }

    throw new Error('Failed to decrypt token - may be corrupted or encrypted with different key')
  }
}

/**
 * Validate that token encryption is working correctly
 * Useful for testing encryption setup on application startup
 *
 * @returns true if encryption is working correctly
 *
 * @example
 * if (!validateEncryption()) {
 *   console.error('Token encryption validation failed')
 * }
 */
export function validateEncryption(): boolean {
  try {
    return validateCrypto()
  } catch (error) {
    console.error('Token encryption validation failed:', error)
    return false
  }
}
