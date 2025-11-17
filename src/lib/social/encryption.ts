/**
 * Encryption utilities for securing OAuth tokens in the database
 * Uses AES-256-CBC encryption with crypto-js
 */

import CryptoJS from 'crypto-js';

/**
 * Encrypt a token using AES-256 encryption
 * @param token - The plaintext token to encrypt
 * @returns Encrypted token as a string
 * @throws Error if ENCRYPTION_KEY is not set
 */
export function encryptToken(token: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (!token || token.trim() === '') {
    throw new Error('Token cannot be empty');
  }

  try {
    const encrypted = CryptoJS.AES.encrypt(token, encryptionKey);
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt an encrypted token
 * @param encryptedToken - The encrypted token to decrypt
 * @returns Decrypted plaintext token
 * @throws Error if decryption fails or ENCRYPTION_KEY is not set
 */
export function decryptToken(encryptedToken: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (!encryptedToken || encryptedToken.trim() === '') {
    throw new Error('Encrypted token cannot be empty');
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedToken, encryptionKey);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext) {
      throw new Error('Decryption resulted in empty string');
    }

    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token - may be corrupted or encrypted with different key');
  }
}

/**
 * Validate that a token can be encrypted and decrypted successfully
 * Useful for testing encryption setup
 * @returns true if encryption is working correctly
 */
export function validateEncryption(): boolean {
  try {
    const testToken = 'test-token-12345';
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    return decrypted === testToken;
  } catch (error) {
    console.error('Encryption validation failed:', error);
    return false;
  }
}
