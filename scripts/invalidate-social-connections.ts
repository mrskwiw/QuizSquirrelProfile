/**
 * Invalidate Social Media Connections Script
 *
 * Purpose: Safely invalidate all OAuth connections during encryption key rotation
 * Strategy: Mark all connections as inactive rather than attempting re-encryption
 *
 * Usage:
 *   npx tsx scripts/invalidate-social-connections.ts [--dry-run]
 *
 * This script should be run BEFORE rotating the ENCRYPTION_KEY to ensure
 * users are notified that their connections need to be re-established.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ConnectionStats {
  totalConnections: number
  tumblrConnections: number
  facebookConnections: number
  affectedUsers: number
}

/**
 * Get statistics on active social media connections
 */
async function getConnectionStats(): Promise<ConnectionStats> {
  const connections = await prisma.socialMediaConnection.findMany({
    where: { isActive: true },
    include: {
      User: {
        select: {
          id: true,
          email: true,
          displayName: true,
        }
      }
    }
  })

  const uniqueUsers = new Set(connections.map(c => c.userId))

  const stats: ConnectionStats = {
    totalConnections: connections.length,
    tumblrConnections: connections.filter(c => c.platform === 'TUMBLR').length,
    facebookConnections: connections.filter(c => c.platform === 'FACEBOOK').length,
    affectedUsers: uniqueUsers.size,
  }

  return stats
}

/**
 * Invalidate all active social media connections
 * @param dryRun - If true, only report what would be changed without making changes
 */
async function invalidateConnections(dryRun: boolean = false): Promise<void> {
  console.log('🔍 Analyzing social media connections...\n')

  const stats = await getConnectionStats()

  console.log('📊 Connection Statistics:')
  console.log(`  Total active connections: ${stats.totalConnections}`)
  console.log(`  Tumblr connections: ${stats.tumblrConnections}`)
  console.log(`  Facebook connections: ${stats.facebookConnections}`)
  console.log(`  Affected users: ${stats.affectedUsers}\n`)

  if (stats.totalConnections === 0) {
    console.log('✅ No active connections to invalidate.')
    return
  }

  if (dryRun) {
    console.log('🏃 DRY RUN MODE: No changes will be made.')
    console.log(`\nWould invalidate ${stats.totalConnections} connections affecting ${stats.affectedUsers} users.\n`)
    return
  }

  console.log('⚠️  WARNING: This will invalidate all social media connections.')
  console.log('Users will need to reconnect their accounts after encryption key rotation.\n')

  // In a real production script, you'd want a confirmation prompt here
  // For automation purposes, we'll proceed directly

  console.log('🔄 Invalidating connections...')

  const result = await prisma.socialMediaConnection.updateMany({
    where: {
      isActive: true
    },
    data: {
      isActive: false
    }
  })

  console.log(`\n✅ Successfully invalidated ${result.count} connections.`)
  console.log('\nNext steps:')
  console.log('  1. Rotate ENCRYPTION_KEY in Vercel environment variables')
  console.log('  2. Deploy application with new encryption key')
  console.log('  3. Users will see "Reconnect your social accounts" message in UI')
  console.log('  4. Users can reconnect via Profile → Social Connections tab\n')
}

/**
 * Export list of affected users for notification purposes
 */
async function exportAffectedUsers(): Promise<void> {
  const connections = await prisma.socialMediaConnection.findMany({
    where: { isActive: true },
    include: {
      User: {
        select: {
          id: true,
          email: true,
          displayName: true,
        }
      }
    },
    distinct: ['userId']
  })

  console.log('\n📧 Affected Users (for notification):')
  console.log('─'.repeat(60))

  const uniqueUsers = new Map<string, any>()
  connections.forEach(c => {
    if (!uniqueUsers.has(c.userId)) {
      uniqueUsers.set(c.userId, c.User)
    }
  })

  uniqueUsers.forEach((user, userId) => {
    console.log(`${user.displayName} <${user.email}>`)
  })

  console.log('─'.repeat(60))
  console.log(`Total: ${uniqueUsers.size} users\n`)
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const exportUsers = args.includes('--export-users')

  console.log('🔐 Social Media Connection Invalidation Script')
  console.log('━'.repeat(60))
  console.log()

  try {
    if (exportUsers) {
      await exportAffectedUsers()
    } else {
      await invalidateConnections(dryRun)
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error during execution:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { invalidateConnections, getConnectionStats, exportAffectedUsers }
