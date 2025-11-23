import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from './prisma'
import { CONFIG } from './config'
import type { User } from '@prisma/client'

// JWT secret loaded from centralized config (validates on startup)
const JWT_SECRET = CONFIG.JWT_SECRET

// In-memory user cache with TTL (5 minutes)
interface UserCacheEntry {
  user: User
  timestamp: number
}

const userCache = new Map<string, UserCacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Get the current authenticated user with caching
 * @returns The authenticated user or null if not authenticated
 * @description Caches user data for 5 minutes to reduce database queries
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token?.value) {
      return null
    }

    const verified = await jwtVerify(token.value, JWT_SECRET)
    const payload = verified.payload as { userId: string }
    const userId = payload.userId

    // Check cache first
    const cached = userCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.user
    }

    // Cache miss or expired - fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    // Update cache if user exists
    if (user) {
      userCache.set(userId, {
        user,
        timestamp: Date.now(),
      })

      // Periodic cache cleanup to prevent memory leaks
      if (userCache.size > 1000) {
        cleanupCache()
      }
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Invalidate cached user data (call after profile updates, role changes, etc.)
 * @param userId - The user ID to invalidate from cache
 */
export function invalidateUserCache(userId: string): void {
  userCache.delete(userId)
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now()
  for (const [userId, entry] of userCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      userCache.delete(userId)
    }
  }
}

// Run cache cleanup every minute to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupCache()
  }, 60 * 1000) // Cleanup every 60 seconds
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}
