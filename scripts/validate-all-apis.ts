/**
 * Combined API Validation Script
 *
 * Purpose: Validate all social media API credentials in one command
 * Usage: npx tsx scripts/validate-all-apis.ts
 *
 * This script validates:
 * - Tumblr API credentials and connectivity
 * - Facebook API credentials and connectivity
 * - Configuration module integrity
 */

import { CONFIG, logConfigurationStatus } from '../src/lib/config'
import { validateConfiguration as validateTumblr, testTumblrAPI } from './validate-tumblr-api'
import { validateConfiguration as validateFacebook, testFacebookAPI, testOAuthFlow as testFacebookOAuth } from './validate-facebook-api'

interface ValidationSummary {
  service: string
  configured: boolean
  working: boolean
  errors: string[]
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔐 Social Media API Validation Suite')
  console.log('━'.repeat(60))
  console.log()

  // Show configuration status
  logConfigurationStatus()
  console.log()

  const summary: ValidationSummary[] = []
  let allPassed = true

  // ========================================================================
  // Tumblr API Validation
  // ========================================================================
  console.log('━'.repeat(60))
  console.log('TUMBLR API VALIDATION')
  console.log('━'.repeat(60))
  console.log()

  const tumblrSummary: ValidationSummary = {
    service: 'Tumblr',
    configured: false,
    working: false,
    errors: []
  }

  const tumblrConfig = validateTumblr()
  tumblrSummary.configured = tumblrConfig.success

  if (tumblrConfig.success) {
    console.log('✅ Tumblr API credentials configured\n')

    const tumblrAPI = await testTumblrAPI()
    tumblrSummary.working = tumblrAPI.success

    if (tumblrAPI.success) {
      console.log('✅ Tumblr API connection successful\n')
    } else {
      console.log('❌ Tumblr API connection failed')
      console.log(`   Error: ${tumblrAPI.message}\n`)
      tumblrSummary.errors.push(tumblrAPI.message)
      allPassed = false
    }
  } else {
    console.log('⚠️  Tumblr API not configured (optional)\n')
  }

  summary.push(tumblrSummary)

  // ========================================================================
  // Facebook API Validation
  // ========================================================================
  console.log('━'.repeat(60))
  console.log('FACEBOOK API VALIDATION')
  console.log('━'.repeat(60))
  console.log()

  const facebookSummary: ValidationSummary = {
    service: 'Facebook',
    configured: false,
    working: false,
    errors: []
  }

  const facebookConfig = validateFacebook()
  facebookSummary.configured = facebookConfig.success

  if (facebookConfig.success) {
    console.log('✅ Facebook API credentials configured\n')

    // Test OAuth flow
    const facebookOAuth = testFacebookOAuth()
    if (facebookOAuth.success) {
      console.log('✅ Facebook OAuth flow generation successful\n')
    } else {
      console.log('❌ Facebook OAuth flow generation failed')
      console.log(`   Error: ${facebookOAuth.message}\n`)
      facebookSummary.errors.push(facebookOAuth.message)
      allPassed = false
    }

    // Test API connectivity
    const facebookAPI = await testFacebookAPI()
    facebookSummary.working = facebookAPI.success

    if (facebookAPI.success) {
      console.log('✅ Facebook API connection successful\n')
    } else {
      console.log('❌ Facebook API connection failed')
      console.log(`   Error: ${facebookAPI.message}\n`)
      facebookSummary.errors.push(facebookAPI.message)
      allPassed = false
    }
  } else {
    console.log('⚠️  Facebook API not configured (optional)\n')
  }

  summary.push(facebookSummary)

  // ========================================================================
  // Summary Report
  // ========================================================================
  console.log('━'.repeat(60))
  console.log('VALIDATION SUMMARY')
  console.log('━'.repeat(60))
  console.log()

  summary.forEach(({ service, configured, working, errors }) => {
    const status = configured && working ? '✅' : configured ? '⚠️' : '⚪'
    console.log(`${status} ${service}:`)
    console.log(`   Configured: ${configured ? '✓' : '✗'}`)
    console.log(`   Working: ${working ? '✓' : (configured ? '✗' : 'N/A')}`)

    if (errors.length > 0) {
      console.log(`   Errors:`)
      errors.forEach(error => console.log(`     • ${error}`))
    }
    console.log()
  })

  // Final result
  const configuredCount = summary.filter(s => s.configured).length
  const workingCount = summary.filter(s => s.working).length

  console.log('━'.repeat(60))

  if (allPassed && configuredCount > 0) {
    console.log('✅ VALIDATION PASSED')
    console.log(`   ${configuredCount} service(s) configured`)
    console.log(`   ${workingCount} service(s) working`)
    console.log()
    console.log('Your application is ready to use social media integrations!')
    console.log()
    process.exit(0)
  } else if (configuredCount === 0) {
    console.log('⚠️  NO SERVICES CONFIGURED')
    console.log()
    console.log('Social media integrations are optional, but you may want to configure:')
    console.log('  • Tumblr API (TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET)')
    console.log('  • Facebook API (FACEBOOK_APP_ID, FACEBOOK_APP_SECRET)')
    console.log()
    console.log('Your application will work without these, but users cannot')
    console.log('connect social accounts or publish to social media.')
    console.log()
    process.exit(0)
  } else {
    console.log('❌ VALIDATION FAILED')
    console.log(`   ${configuredCount} service(s) configured`)
    console.log(`   ${workingCount} service(s) working`)
    console.log()
    console.log('Please fix the errors above and try again.')
    console.log()
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Unexpected error during validation:', error)
    process.exit(1)
  })
}
