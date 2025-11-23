/**
 * Centralized Configuration Module
 *
 * Single source of truth for all environment variables and secrets.
 * Implements fail-fast validation to prevent startup with missing secrets.
 *
 * @module config
 * @description Loads and validates all environment variables on application startup.
 * Application will fail to start if critical secrets are missing.
 */

/**
 * Require a secret to be present, throw error if missing
 * @param name - Environment variable name
 * @param displayName - Human-readable name for error messages
 * @returns Trimmed secret value
 * @throws Error if secret is missing or empty
 */
function requireSecret(name: string, displayName?: string): string {
  const value = process.env[name]

  if (!value || value.trim() === '') {
    throw new Error(
      `CRITICAL: ${displayName || name} environment variable is not set. ` +
      `Application cannot start without this secret. ` +
      `Please set ${name} in your environment variables.`
    )
  }

  return value.trim()
}

/**
 * Optional secret - returns undefined if not set
 * @param name - Environment variable name
 * @returns Secret value or undefined
 */
function optionalSecret(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim() !== '' ? value.trim() : undefined
}

/**
 * Validate secret meets minimum security requirements
 * @param name - Secret name for error messages
 * @param value - Secret value to validate
 * @param minLength - Minimum required length
 * @throws Error if secret is too short
 */
function validateSecretStrength(
  name: string,
  value: string,
  minLength: number
): void {
  if (value.length < minLength) {
    throw new Error(
      `SECURITY: ${name} must be at least ${minLength} characters for security. ` +
      `Current length: ${value.length}. Please generate a stronger secret.`
    )
  }
}

// ============================================================================
// CRITICAL SECRETS (Application won't start without these)
// ============================================================================

const JWT_SECRET_RAW = requireSecret('JWT_SECRET', 'JWT Secret')
validateSecretStrength('JWT_SECRET', JWT_SECRET_RAW, 32)

const ENCRYPTION_KEY_RAW = requireSecret('ENCRYPTION_KEY', 'Encryption Key')
validateSecretStrength('ENCRYPTION_KEY', ENCRYPTION_KEY_RAW, 32)

// ============================================================================
// CONFIGURATION OBJECT (Exported)
// ============================================================================

/**
 * Application configuration object
 * Contains all environment variables and secrets in a type-safe manner
 */
export const CONFIG = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',

  // Database
  // Note: Prisma loads DATABASE_URL automatically, we don't re-export to avoid duplication

  // Authentication
  JWT_SECRET: new TextEncoder().encode(JWT_SECRET_RAW),
  JWT_SECRET_RAW, // Keep raw for potential logging (never expose to client)

  // Encryption
  ENCRYPTION_KEY: ENCRYPTION_KEY_RAW,

  // Tumblr API
  TUMBLR: {
    CONSUMER_KEY: optionalSecret('TUMBLR_CONSUMER_KEY'),
    CONSUMER_SECRET: optionalSecret('TUMBLR_CONSUMER_SECRET'),
    CALLBACK_URL: optionalSecret('TUMBLR_CALLBACK_URL') ||
      `${optionalSecret('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'}/api/social/tumblr/auth/callback`,
    isConfigured(): boolean {
      return !!(this.CONSUMER_KEY && this.CONSUMER_SECRET)
    },
  },

  // Facebook API
  FACEBOOK: {
    APP_ID: optionalSecret('FACEBOOK_APP_ID'),
    APP_SECRET: optionalSecret('FACEBOOK_APP_SECRET'),
    CALLBACK_URL: optionalSecret('FACEBOOK_CALLBACK_URL') ||
      `${optionalSecret('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000'}/api/social/facebook/auth/callback`,
    isConfigured(): boolean {
      return !!(this.APP_ID && this.APP_SECRET)
    },
  },

  // Stripe (future)
  STRIPE: {
    PUBLISHABLE_KEY: optionalSecret('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    SECRET_KEY: optionalSecret('STRIPE_SECRET_KEY'),
    WEBHOOK_SECRET: optionalSecret('STRIPE_WEBHOOK_SECRET'),
    isConfigured(): boolean {
      return !!this.SECRET_KEY
    },
  },

  // Application
  BASE_URL: optionalSecret('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000',

} as const

// ============================================================================
// STARTUP VALIDATION & LOGGING
// ============================================================================

/**
 * Log configuration status on startup (safe for logs - no secret values)
 * Helps debug missing configuration without exposing secrets
 */
export function logConfigurationStatus(): void {
  console.log('📋 Configuration Status:')
  console.log(`  Environment: ${CONFIG.NODE_ENV}`)
  console.log(`  Base URL: ${CONFIG.BASE_URL}`)
  console.log(`  JWT Secret: ✓ Set (${CONFIG.JWT_SECRET_RAW.length} chars)`)
  console.log(`  Encryption Key: ✓ Set (${CONFIG.ENCRYPTION_KEY.length} chars)`)
  console.log(`  Tumblr API: ${CONFIG.TUMBLR.isConfigured() ? '✓ Configured' : '⚠ Not configured (optional)'}`)
  console.log(`  Facebook API: ${CONFIG.FACEBOOK.isConfigured() ? '✓ Configured' : '⚠ Not configured (optional)'}`)
  console.log(`  Stripe: ${CONFIG.STRIPE.isConfigured() ? '✓ Configured' : '⚠ Not configured (optional)'}`)
}

// Run validation on module load in production
if (CONFIG.IS_PRODUCTION) {
  logConfigurationStatus()
}

// Export type for TypeScript
export type Config = typeof CONFIG
