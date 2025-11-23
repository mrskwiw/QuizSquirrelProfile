/**
 * Cryptographic utilities using Node.js native crypto module
 *
 * Implements AES-256-GCM (Authenticated Encryption with Associated Data)
 * for securing OAuth tokens and other sensitive data in the database.
 *
 * Security improvements over crypto-js:
 * - Authenticated encryption (tamper detection via authentication tag)
 * - Random IV generation for each encryption operation
 * - Native Node.js implementation (better security auditing)
 * - AEAD protection against padding oracle attacks
 *
 * @module crypto
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'
import { CONFIG } from './config'

/**
 * AES-256-GCM algorithm configuration
 */
const ALGORITHM = 'aes-256-gcm' as const
const IV_LENGTH = 12 // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Derive a 256-bit encryption key from the ENCRYPTION_KEY environment variable
 * Uses SHA-256 to ensure consistent key length regardless of input
 *
 * @returns 32-byte Buffer suitable for AES-256
 */
function deriveKey(): Buffer {
  // CONFIG.ENCRYPTION_KEY is validated on startup (must be 32+ chars)
  return createHash('sha256')
    .update(CONFIG.ENCRYPTION_KEY)
    .digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 *
 * Format: iv (12 bytes) + authTag (16 bytes) + ciphertext (variable)
 * Encoded as base64 for database storage
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data with IV and auth tag
 * @throws Error if encryption fails
 *
 * @example
 * const encrypted = encrypt('my-oauth-token-12345')
 * // Returns: "j8fK3pL9mN2xQ5vW8zB7..." (base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext.trim() === '') {
    throw new Error('Plaintext cannot be empty')
  }

  try {
    // Generate random IV (different for every encryption)
    const iv = randomBytes(IV_LENGTH)

    // Derive encryption key from environment variable
    const key = deriveKey()

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv)

    // Encrypt plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ])

    // Get authentication tag (tamper detection)
    const authTag = cipher.getAuthTag()

    // Combine: iv + authTag + ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted])

    // Encode as base64 for database storage
    return combined.toString('base64')

  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt a base64-encoded encrypted string using AES-256-GCM
 *
 * @param encryptedData - Base64-encoded string with IV, auth tag, and ciphertext
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails or authentication tag is invalid
 *
 * @example
 * const decrypted = decrypt('j8fK3pL9mN2xQ5vW8zB7...')
 * // Returns: "my-oauth-token-12345"
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim() === '') {
    throw new Error('Encrypted data cannot be empty')
  }

  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64')

    // Validate minimum length
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted data format')
    }

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    // Derive encryption key
    const key = deriveKey()

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv)

    // Set authentication tag for verification
    decipher.setAuthTag(authTag)

    // Decrypt ciphertext
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final() // Throws if auth tag verification fails
    ])

    // Convert to UTF-8 string
    const plaintext = decrypted.toString('utf8')

    if (!plaintext) {
      throw new Error('Decryption resulted in empty string')
    }

    return plaintext

  } catch (error) {
    console.error('Decryption error:', error)

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('Unsupported state')) {
        throw new Error('Failed to decrypt data - authentication tag verification failed (data may be tampered)')
      }
      if (error.message.includes('Invalid encrypted data format')) {
        throw error
      }
    }

    throw new Error('Failed to decrypt data - may be corrupted or encrypted with different key')
  }
}

/**
 * Validate that encryption/decryption is working correctly
 * Useful for testing encryption setup on application startup
 *
 * @returns true if encryption is working correctly, false otherwise
 *
 * @example
 * if (!validateEncryption()) {
 *   console.error('Encryption validation failed - check ENCRYPTION_KEY')
 * }
 */
export function validateEncryption(): boolean {
  try {
    const testData = 'test-encryption-12345-αβγδε'
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)

    // Verify round-trip encryption
    if (decrypted !== testData) {
      console.error('Encryption validation failed: decrypted data does not match original')
      return false
    }

    // Verify tamper detection (modify encrypted data)
    try {
      const tamperedData = encrypted.slice(0, -4) + 'XXXX'
      decrypt(tamperedData)
      // If we get here, tamper detection failed
      console.error('Encryption validation failed: tamper detection not working')
      return false
    } catch (error) {
      // Expected to throw - tamper was detected
    }

    return true

  } catch (error) {
    console.error('Encryption validation failed:', error)
    return false
  }
}

/**
 * Generate a cryptographically secure random string
 * Useful for generating state tokens, nonces, etc.
 *
 * @param length - Number of bytes to generate (default: 32)
 * @returns Base64url-encoded random string
 *
 * @example
 * const state = generateRandomString(32)
 * // Returns: "Kj8fL2pM9nN3xR5wW8zC7vB6tD4sA1..."
 */
export function generateRandomString(length: number = 32): string {
  return randomBytes(length).toString('base64url')
}

/**
 * Create a SHA-256 hash of a string
 * Useful for generating code challenges (PKCE), state validation, etc.
 *
 * @param data - String to hash
 * @returns Base64url-encoded hash
 *
 * @example
 * const codeChallenge = hashString(codeVerifier)
 */
export function hashString(data: string): string {
  return createHash('sha256')
    .update(data)
    .digest('base64url')
}
