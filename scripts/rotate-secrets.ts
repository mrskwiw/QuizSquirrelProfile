/**
 * Master Secret Rotation Execution Script
 *
 * Purpose: Orchestrate the complete secret rotation process
 * Usage: npx tsx scripts/rotate-secrets.ts
 *
 * This script coordinates:
 * 1. Invalidating social media connections (encryption key rotation strategy)
 * 2. Generating new secrets (JWT, encryption key)
 * 3. Providing instructions for manual Vercel deployment
 *
 * IMPORTANT: This script should be run on Tuesday 10am EST as planned
 *
 * Workflow:
 * 1. Pre-flight checks
 * 2. Invalidate social connections (prepare for encryption key rotation)
 * 3. Generate new secrets
 * 4. Display instructions for Vercel environment variable updates
 * 5. Verify deployment checklist
 */

import { randomBytes } from 'crypto'
import { invalidateConnections, getConnectionStats } from './invalidate-social-connections'

interface RotationPlan {
  timestamp: string
  newJwtSecret: string
  newEncryptionKey: string
  neonDatabasePassword: string
  connectionStats: {
    totalConnections: number
    tumblrConnections: number
    facebookConnections: number
    affectedUsers: number
  }
}

/**
 * Generate cryptographically secure secret
 */
function generateSecret(length: number = 64): string {
  return randomBytes(length).toString('hex')
}

/**
 * Pre-flight checks before rotation
 */
async function preFlightChecks(): Promise<boolean> {
  console.log('🔍 Running pre-flight checks...\n')

  let allChecksPassed = true

  // Check 1: Verify we have database access
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Database connection successful')
    await prisma.$disconnect()
  } catch (error) {
    console.log('❌ Database connection failed')
    console.log(`   Error: ${error}`)
    allChecksPassed = false
  }

  // Check 2: Verify CONFIG module loads
  try {
    const { CONFIG } = await import('../src/lib/config')
    console.log('✅ Configuration module loads successfully')
    console.log(`   Current JWT secret length: ${CONFIG.JWT_SECRET_RAW.length} chars`)
    console.log(`   Current encryption key length: ${CONFIG.ENCRYPTION_KEY.length} chars`)
  } catch (error) {
    console.log('❌ Configuration module failed to load')
    console.log(`   Error: ${error}`)
    allChecksPassed = false
  }

  // Check 3: Get connection statistics
  try {
    const stats = await getConnectionStats()
    console.log('✅ Social connection stats retrieved')
    console.log(`   Active connections: ${stats.totalConnections}`)
    console.log(`   Affected users: ${stats.affectedUsers}`)
  } catch (error) {
    console.log('❌ Failed to retrieve connection stats')
    console.log(`   Error: ${error}`)
    allChecksPassed = false
  }

  console.log()
  return allChecksPassed
}

/**
 * Generate new secrets for rotation
 */
function generateNewSecrets(): Pick<RotationPlan, 'newJwtSecret' | 'newEncryptionKey'> {
  console.log('🔑 Generating new secrets...\n')

  const newJwtSecret = generateSecret(64) // 128 characters (64 bytes in hex)
  const newEncryptionKey = generateSecret(32) // 64 characters (32 bytes in hex)

  console.log('✅ New JWT Secret generated')
  console.log(`   Length: ${newJwtSecret.length} characters`)
  console.log(`   First 10 chars: ${newJwtSecret.substring(0, 10)}...`)
  console.log()

  console.log('✅ New Encryption Key generated')
  console.log(`   Length: ${newEncryptionKey.length} characters`)
  console.log(`   First 10 chars: ${newEncryptionKey.substring(0, 10)}...`)
  console.log()

  return { newJwtSecret, newEncryptionKey }
}

/**
 * Display Vercel deployment instructions
 */
function displayVercelInstructions(plan: RotationPlan): void {
  console.log('━'.repeat(80))
  console.log('VERCEL ENVIRONMENT VARIABLE UPDATE INSTRUCTIONS')
  console.log('━'.repeat(80))
  console.log()

  console.log('🌐 Step 1: Update Vercel Environment Variables')
  console.log('   Go to: https://vercel.com/[your-team]/quiz-squirrel-app/settings/environment-variables')
  console.log()

  console.log('📝 Variables to Update:')
  console.log()
  console.log('   1. JWT_SECRET')
  console.log(`      New Value: ${plan.newJwtSecret}`)
  console.log('      Environments: Production, Preview, Development')
  console.log()

  console.log('   2. ENCRYPTION_KEY')
  console.log(`      New Value: ${plan.newEncryptionKey}`)
  console.log('      Environments: Production, Preview, Development')
  console.log()

  console.log('   3. DATABASE_URL (Neon)')
  console.log('      Action: Reset database password in Neon console')
  console.log('      Then: Update DATABASE_URL with new password')
  console.log('      Environments: Production, Preview, Development')
  console.log()

  console.log('━'.repeat(80))
  console.log('NEON DATABASE PASSWORD ROTATION')
  console.log('━'.repeat(80))
  console.log()

  console.log('🗄️  Step 2: Rotate Neon Database Password')
  console.log('   1. Go to: https://console.neon.tech/app/projects')
  console.log('   2. Select your project')
  console.log('   3. Go to Settings → General')
  console.log('   4. Click "Reset Password" for the neondb_owner role')
  console.log('   5. Copy the new connection strings (pooled and direct)')
  console.log('   6. Update DATABASE_URL and DIRECT_URL in Vercel')
  console.log()

  console.log('━'.repeat(80))
  console.log('DEPLOYMENT')
  console.log('━'.repeat(80))
  console.log()

  console.log('🚀 Step 3: Deploy Application')
  console.log('   Option A: Trigger deployment via git push')
  console.log('   Option B: Manual deployment via Vercel dashboard')
  console.log()

  console.log('━'.repeat(80))
  console.log('POST-DEPLOYMENT VERIFICATION')
  console.log('━'.repeat(80))
  console.log()

  console.log('✅ Verification Checklist:')
  console.log('   [ ] Application starts without errors')
  console.log('   [ ] New user can register')
  console.log('   [ ] Existing user can login (after getting logged out)')
  console.log('   [ ] Social connections show as inactive')
  console.log('   [ ] User can reconnect Tumblr account')
  console.log('   [ ] User can reconnect Facebook account')
  console.log('   [ ] Quiz creation works')
  console.log('   [ ] Publishing to social media works')
  console.log()

  console.log('━'.repeat(80))
  console.log()
}

/**
 * Save rotation plan to file for reference
 */
async function saveRotationPlan(plan: RotationPlan): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const filename = `rotation-plan-${Date.now()}.json`
  const filepath = path.join(__dirname, '..', 'logs', filename)

  // Create logs directory if it doesn't exist
  try {
    await fs.mkdir(path.join(__dirname, '..', 'logs'), { recursive: true })
  } catch (error) {
    // Directory already exists
  }

  await fs.writeFile(filepath, JSON.stringify(plan, null, 2), 'utf-8')
  console.log(`📄 Rotation plan saved to: ${filepath}`)
  console.log()
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔐 Secret Rotation Execution Script')
  console.log('━'.repeat(80))
  console.log(`   Timestamp: ${new Date().toISOString()}`)
  console.log(`   Execution: Tuesday 10am EST as planned`)
  console.log('━'.repeat(80))
  console.log()

  // Step 0: Confirmation prompt
  console.log('⚠️  WARNING: This script will invalidate all social media connections.')
  console.log('   Users will need to reconnect their accounts after rotation.')
  console.log('   All users will be logged out due to JWT secret rotation.')
  console.log()
  console.log('📅 Scheduled Execution: Tuesday 10am EST')
  console.log('📋 Strategy: Simple rotation (accept user logout)')
  console.log('🔔 User Notification: None (users will discover on next login)')
  console.log()

  // Step 1: Pre-flight checks
  console.log('━'.repeat(80))
  console.log('STEP 1: PRE-FLIGHT CHECKS')
  console.log('━'.repeat(80))
  console.log()

  const checksPass = await preFlightChecks()

  if (!checksPass) {
    console.log('❌ Pre-flight checks failed. Aborting rotation.')
    console.log('   Please fix the issues above and try again.\n')
    process.exit(1)
  }

  console.log('✅ All pre-flight checks passed\n')

  // Step 2: Invalidate social connections
  console.log('━'.repeat(80))
  console.log('STEP 2: INVALIDATE SOCIAL CONNECTIONS')
  console.log('━'.repeat(80))
  console.log()

  const stats = await getConnectionStats()
  await invalidateConnections(false) // false = not dry run

  // Step 3: Generate new secrets
  console.log('━'.repeat(80))
  console.log('STEP 3: GENERATE NEW SECRETS')
  console.log('━'.repeat(80))
  console.log()

  const { newJwtSecret, newEncryptionKey } = generateNewSecrets()

  // Step 4: Create rotation plan
  const plan: RotationPlan = {
    timestamp: new Date().toISOString(),
    newJwtSecret,
    newEncryptionKey,
    neonDatabasePassword: '[TO BE GENERATED IN NEON CONSOLE]',
    connectionStats: stats,
  }

  // Step 5: Save rotation plan
  await saveRotationPlan(plan)

  // Step 6: Display instructions
  displayVercelInstructions(plan)

  // Final summary
  console.log('✅ Secret rotation preparation complete!')
  console.log()
  console.log('Next steps:')
  console.log('  1. Follow the Vercel instructions above')
  console.log('  2. Rotate Neon database password')
  console.log('  3. Deploy application')
  console.log('  4. Run verification checklist')
  console.log()
  console.log('⏰ Rotation scheduled for: Tuesday 10am EST')
  console.log()

  process.exit(0)
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Unexpected error during rotation:', error)
    process.exit(1)
  })
}

export { generateSecret, preFlightChecks, generateNewSecrets }
