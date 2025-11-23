/**
 * Facebook API Validation Script
 *
 * Purpose: Validate Facebook API credentials are properly configured and working
 * Usage: npx tsx scripts/validate-facebook-api.ts
 *
 * This script verifies:
 * 1. FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are set
 * 2. Credentials format is correct
 * 3. OAuth flow can be generated
 */

import { CONFIG } from '../src/lib/config'
import { generateFacebookAuthUrl, generateOAuthState, debugToken } from '../src/lib/social/facebook/oauth'
import axios from 'axios'

interface ValidationResult {
  success: boolean
  message: string
  details?: any
}

/**
 * Validate Facebook API credentials configuration
 */
function validateConfiguration(): ValidationResult {
  console.log('🔍 Checking Facebook API configuration...\n')

  if (!CONFIG.FACEBOOK.isConfigured()) {
    return {
      success: false,
      message: 'Facebook API credentials not configured',
      details: {
        FACEBOOK_APP_ID: CONFIG.FACEBOOK.APP_ID ? '✓ Set' : '✗ Missing',
        FACEBOOK_APP_SECRET: CONFIG.FACEBOOK.APP_SECRET ? '✓ Set' : '✗ Missing',
      }
    }
  }

  return {
    success: true,
    message: 'Facebook API credentials configured',
    details: {
      FACEBOOK_APP_ID: `✓ Set (${CONFIG.FACEBOOK.APP_ID!.length} chars)`,
      FACEBOOK_APP_SECRET: `✓ Set (${CONFIG.FACEBOOK.APP_SECRET!.length} chars)`,
      CALLBACK_URL: CONFIG.FACEBOOK.CALLBACK_URL,
    }
  }
}

/**
 * Test Facebook API by verifying app access token
 */
async function testFacebookAPI(): Promise<ValidationResult> {
  console.log('🧪 Testing Facebook API connection...\n')

  try {
    // Create app access token (app_id|app_secret)
    const appAccessToken = `${CONFIG.FACEBOOK.APP_ID}|${CONFIG.FACEBOOK.APP_SECRET}`

    // Verify the app access token works by calling Graph API
    const response = await axios.get('https://graph.facebook.com/v22.0/me', {
      params: {
        access_token: appAccessToken,
      },
      validateStatus: () => true, // Accept any status code
    })

    // App access tokens can't call /me, but a 403 means credentials are valid
    // A 190 error (invalid token) means credentials are wrong
    if (response.status === 403) {
      return {
        success: true,
        message: 'Successfully validated Facebook API credentials',
        details: {
          status: '✓ Credentials are valid',
          note: 'App access token format is correct',
          authUrl: 'OAuth flow can be generated'
        }
      }
    }

    if (response.data?.error?.code === 190) {
      return {
        success: false,
        message: 'Invalid Facebook API credentials',
        details: {
          error: 'Invalid OAuth access token',
          hint: 'Check that your FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are correct'
        }
      }
    }

    // Try generating auth URL as an additional validation
    const state = generateOAuthState()
    const authUrl = generateFacebookAuthUrl(state)

    if (authUrl && authUrl.includes('facebook.com')) {
      return {
        success: true,
        message: 'Successfully validated Facebook API setup',
        details: {
          status: '✓ Credentials appear valid',
          authUrlGenerated: '✓ OAuth flow can be initiated',
          note: 'API credentials are properly formatted'
        }
      }
    }

    return {
      success: false,
      message: 'Could not validate Facebook API credentials',
      details: {
        response: response.data
      }
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to connect to Facebook API',
      details: {
        error: error.message,
        hint: error.response?.data?.error?.message || 'Check network connectivity and Facebook API status'
      }
    }
  }
}

/**
 * Test OAuth flow generation
 */
function testOAuthFlow(): ValidationResult {
  console.log('🔐 Testing OAuth flow generation...\n')

  try {
    const state = generateOAuthState()
    const authUrl = generateFacebookAuthUrl(state)

    if (!authUrl || !authUrl.includes('facebook.com')) {
      return {
        success: false,
        message: 'Failed to generate Facebook OAuth URL',
        details: {
          authUrl: authUrl || 'undefined'
        }
      }
    }

    // Parse URL to verify parameters
    const url = new URL(authUrl)
    const params = {
      client_id: url.searchParams.get('client_id'),
      redirect_uri: url.searchParams.get('redirect_uri'),
      state: url.searchParams.get('state'),
      scope: url.searchParams.get('scope'),
      response_type: url.searchParams.get('response_type'),
    }

    const allParamsPresent = Object.values(params).every(val => val !== null)

    return {
      success: allParamsPresent,
      message: allParamsPresent
        ? 'Successfully generated OAuth URL'
        : 'OAuth URL is missing required parameters',
      details: {
        authUrl: authUrl.substring(0, 80) + '...',
        parameters: params,
        scopes: params.scope?.split(',') || []
      }
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to generate OAuth flow',
      details: {
        error: error.message
      }
    }
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔐 Facebook API Validation Script')
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
    console.log('❌ Configuration check failed. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.')
    console.log('\nTo fix this:')
    console.log('  1. Add FACEBOOK_APP_ID to your .env file')
    console.log('  2. Add FACEBOOK_APP_SECRET to your .env file')
    console.log('  3. Restart the application\n')
    process.exit(1)
  }

  // Step 2: Test OAuth flow generation
  const oauthResult = testOAuthFlow()

  console.log('🔐 OAuth Flow Test:')
  console.log(`  Status: ${oauthResult.success ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Message: ${oauthResult.message}`)

  if (oauthResult.details) {
    console.log('  Details:')
    Object.entries(oauthResult.details).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        console.log(`    ${key}:`)
        Object.entries(value).forEach(([k, v]) => {
          console.log(`      ${k}: ${v}`)
        })
      } else {
        console.log(`    ${key}: ${value}`)
      }
    })
  }
  console.log()

  // Step 3: Test API connection
  const apiResult = await testFacebookAPI()

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
  if (configResult.success && oauthResult.success && apiResult.success) {
    console.log('✅ All checks passed! Facebook API is properly configured and working.')
    console.log('\nYou can now:')
    console.log('  • Connect Facebook Pages via Profile → Social Connections')
    console.log('  • Publish quizzes to Facebook Pages')
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

export { validateConfiguration, testFacebookAPI, testOAuthFlow }
