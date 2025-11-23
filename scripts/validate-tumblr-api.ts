/**
 * Tumblr API Validation Script
 *
 * Purpose: Validate Tumblr API credentials are properly configured and working
 * Usage: npx tsx scripts/validate-tumblr-api.ts
 *
 * This script verifies:
 * 1. TUMBLR_CONSUMER_KEY and TUMBLR_CONSUMER_SECRET are set
 * 2. Credentials can successfully make API requests to Tumblr
 * 3. OAuth flow can be initiated
 */

import { CONFIG } from '../src/lib/config'
import { requestTumblrToken } from '../src/lib/social/tumblr/oauth'

interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

/**
 * Validate Tumblr API credentials configuration
 */
function validateConfiguration(): ValidationResult {
  console.log('🔍 Checking Tumblr API configuration...\n')

  if (!CONFIG.TUMBLR.isConfigured()) {
    return {
      success: false,
      message: 'Tumblr API credentials not configured',
      details: {
        TUMBLR_CONSUMER_KEY: CONFIG.TUMBLR.CONSUMER_KEY ? '✓ Set' : '✗ Missing',
        TUMBLR_CONSUMER_SECRET: CONFIG.TUMBLR.CONSUMER_SECRET ? '✓ Set' : '✗ Missing',
      }
    }
  }

  return {
    success: true,
    message: 'Tumblr API credentials configured',
    details: {
      TUMBLR_CONSUMER_KEY: `✓ Set (${CONFIG.TUMBLR.CONSUMER_KEY!.length} chars)`,
      TUMBLR_CONSUMER_SECRET: `✓ Set (${CONFIG.TUMBLR.CONSUMER_SECRET!.length} chars)`,
      CALLBACK_URL: CONFIG.TUMBLR.CALLBACK_URL,
    }
  }
}

/**
 * Test Tumblr API by requesting a temporary OAuth token
 */
async function testTumblrAPI(): Promise<ValidationResult> {
  console.log('🧪 Testing Tumblr API connection...\n')

  try {
    // Attempt to request temporary OAuth token
    // This validates that the consumer key/secret are correct
    const callbackUrl = CONFIG.TUMBLR.CALLBACK_URL || 'http://localhost:3000/api/social/tumblr/auth/callback'

    const result = await requestTumblrToken(callbackUrl)

    if (result.oauthToken && result.oauthTokenSecret) {
      return {
        success: true,
        message: 'Successfully connected to Tumblr API',
        details: {
          oauthCallbackConfirmed: result.oauthCallbackConfirmed,
          tokenReceived: '✓ Temporary token generated',
          note: 'API credentials are valid and working'
        }
      }
    }

    return {
      success: false,
      message: 'Invalid response from Tumblr API',
      details: result
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to connect to Tumblr API',
      details: {
        error: error.message,
        hint: error.message.includes('credentials')
          ? 'Check that your TUMBLR_CONSUMER_KEY and TUMBLR_CONSUMER_SECRET are correct'
          : 'Check network connectivity and Tumblr API status'
      }
    }
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔐 Tumblr API Validation Script')
  console.log('━'.repeat(60))
  console.log()

  // Step 1: Validate configuration
  const configResult = validateConfiguration()

  console.log('📋 Configuration Check:')
  console.log(`  Status: ${configResult.success ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Message: ${configResult.message}`)

  if (configResult.details) {
    console.log('  Details:')
    Object.entries(configResult.details).forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`)
    })
  }
  console.log()

  if (!configResult.success) {
    console.log('❌ Configuration check failed. Please set TUMBLR_CONSUMER_KEY and TUMBLR_CONSUMER_SECRET.')
    console.log('\nTo fix this:')
    console.log('  1. Add TUMBLR_CONSUMER_KEY to your .env file')
    console.log('  2. Add TUMBLR_CONSUMER_SECRET to your .env file')
    console.log('  3. Restart the application\n')
    process.exit(1)
  }

  // Step 2: Test API connection
  const apiResult = await testTumblrAPI()

  console.log('🧪 API Connection Test:')
  console.log(`  Status: ${apiResult.success ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Message: ${apiResult.message}`)

  if (apiResult.details) {
    console.log('  Details:')
    Object.entries(apiResult.details).forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`)
    })
  }
  console.log()

  // Final summary
  if (configResult.success && apiResult.success) {
    console.log('✅ All checks passed! Tumblr API is properly configured and working.')
    console.log('\nYou can now:')
    console.log('  • Connect Tumblr accounts via Profile → Social Connections')
    console.log('  • Publish quizzes to Tumblr blogs')
    console.log()
    process.exit(0)
  } else {
    console.log('❌ Validation failed. Please fix the issues above and try again.\n')
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
}

export { validateConfiguration, testTumblrAPI }
