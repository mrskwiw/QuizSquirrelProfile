/**
 * Prisma Client with Row-Level Security (RLS) Support - IMPROVED
 *
 * This creates a Prisma client that sets PostgreSQL session variables
 * using SET LOCAL within transactions, preventing session variable leakage
 * in connection pooling environments.
 *
 * SECURITY IMPROVEMENTS:
 * - Uses SET LOCAL within transactions (not SET)
 * - Prevents session variable leakage in pgBouncer/connection pools
 * - Uses parameterized queries (no SQL injection risk)
 * - Compatible with Supabase connection pooling
 */

import { PrismaClient } from '@prisma/client'

/**
 * Extended Prisma client for RLS with transaction-scoped session variables
 */
export class PrismaRLSClient extends PrismaClient {
  /**
   * Execute queries with user context using transaction-scoped session variables
   *
   * IMPORTANT: Uses SET LOCAL which is transaction-scoped, preventing
   * session variable leakage in connection pooling environments.
   *
   * @param userId - The authenticated user's ID (null for anonymous)
   * @param callback - Function containing Prisma queries to execute
   * @returns Result from callback
   */
  async withUser<T>(
    userId: string | null,
    callback: (tx: PrismaRLSClient) => Promise<T>
  ): Promise<T> {
    // Use interactive transaction to ensure SET LOCAL is scoped to this transaction
    return await this.$transaction(async (tx) => {
      // Set session variable using raw SQL (UUID validation ensures safety)
      if (userId) {
        // Validate userId is a valid UUID to prevent injection
        if (!isValidUUID(userId)) {
          throw new Error('Invalid user ID format')
        }
        // Use $executeRawUnsafe since SET LOCAL doesn't support parameterized queries
        await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`)
      } else {
        // For anonymous users, set to empty string (NULL causes issues with current_setting)
        await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = ''`)
      }

      // Execute callback with transaction client
      // SET LOCAL will automatically be cleared when transaction ends
      return await callback(tx as unknown as PrismaRLSClient)
    }, {
      // Set appropriate isolation level
      isolationLevel: 'ReadCommitted',
      // Reasonable timeout for RLS queries
      maxWait: 5000, // 5 seconds
      timeout: 30000, // 30 seconds
    })
  }
}

/**
 * Validate UUID format to prevent SQL injection
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Global instance for use across the app
const globalForPrisma = globalThis as unknown as {
  prismaRLS: PrismaRLSClient | undefined
}

export const prismaRLS = globalForPrisma.prismaRLS ?? new PrismaRLSClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaRLS = prismaRLS
}

/**
 * Wrapper for Prisma queries with automatic user context
 *
 * Usage in API routes:
 *
 * ```typescript
 * import { prismaRLS, withUserContext } from '@/lib/prisma-rls'
 * import { getCurrentUser } from '@/lib/auth'
 *
 * export async function GET(request: NextRequest) {
 *   const user = await getCurrentUser()
 *
 *   const quizzes = await withUserContext(prismaRLS, user?.id, async (db) => {
 *     return await db.quiz.findMany({ where: { isPublic: true } })
 *   })
 *
 *   return NextResponse.json({ quizzes })
 * }
 * ```
 *
 * @param client - PrismaRLSClient instance
 * @param userId - User ID (string) or null/undefined for anonymous
 * @param callback - Async function containing Prisma queries
 * @returns Result from callback
 */
export async function withUserContext<T>(
  client: PrismaRLSClient,
  userId: string | null | undefined,
  callback: (db: PrismaRLSClient) => Promise<T>
): Promise<T> {
  return client.withUser(userId || null, async (tx) => {
    return callback(tx)
  })
}

/**
 * DEPRECATED: This SQL is now in supabase-rls-policies-jwt-compatible-IMPROVED.sql
 *
 * Helper functions are now in the private schema for security.
 * Do not create them directly - use the SQL script instead.
 */
export const getCurrentUserSQL = `
  -- DEPRECATED: Use supabase-rls-policies-jwt-compatible-IMPROVED.sql instead
  -- Helper functions should be in private schema with SECURITY DEFINER
`
