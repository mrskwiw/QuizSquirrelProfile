/**
 * Distributed Rate Limiting Service using Upstash Redis
 *
 * Replaces in-memory rate limiting with distributed Redis-backed implementation
 * that works correctly across serverless function instances.
 *
 * @module rate-limit
 */

import { Redis } from '@upstash/redis'

/**
 * Initialize Redis client (lazy initialization)
 */
let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        'CRITICAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required. ' +
        'Rate limiting cannot function without Redis. Please configure Upstash Redis.'
      )
    }

    redis = new Redis({
      url,
      token,
    })
  }

  return redis
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requests: number  // Maximum requests allowed
  windowMs: number  // Time window in milliseconds
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean    // Whether the request is allowed
  remaining: number   // Remaining requests in window
  resetTime: number   // Timestamp when the window resets
  limit: number       // Total limit for this window
}

/**
 * Check rate limit for a given key
 *
 * Uses sliding window counter algorithm with Redis for distributed tracking.
 *
 * @param key - Unique identifier (e.g., "ip:path" like "192.168.1.1:/api/auth")
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const client = getRedisClient()
    const now = Date.now()

    // Create time-based window key
    // Window is based on current time divided by window duration
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs
    const windowKey = `ratelimit:${key}:${windowStart}`

    // Increment counter for this window
    const count = await client.incr(windowKey)

    // Set expiration on first request in window (TTL = window duration in seconds)
    if (count === 1) {
      await client.expire(windowKey, Math.ceil(config.windowMs / 1000))
    }

    // Calculate when window resets
    const resetTime = windowStart + config.windowMs

    // Check if limit exceeded
    const allowed = count <= config.requests
    const remaining = Math.max(0, config.requests - count)

    return {
      allowed,
      remaining,
      resetTime,
      limit: config.requests
    }

  } catch (error) {
    console.error('Rate limit check failed:', error)

    // FAIL OPEN: If Redis is unavailable, allow the request
    // This prevents Redis outages from taking down the entire application
    // Log the error for monitoring
    console.error('CRITICAL: Rate limiting failed, allowing request (fail open)', {
      key,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    return {
      allowed: true,
      remaining: config.requests,
      resetTime: Date.now() + config.windowMs,
      limit: config.requests
    }
  }
}

/**
 * Get current rate limit status without incrementing
 * Useful for checking status without consuming a request
 *
 * @param key - Unique identifier
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const client = getRedisClient()
    const now = Date.now()

    const windowStart = Math.floor(now / config.windowMs) * config.windowMs
    const windowKey = `ratelimit:${key}:${windowStart}`

    const count = await client.get<number>(windowKey) || 0
    const resetTime = windowStart + config.windowMs

    return {
      allowed: count < config.requests,
      remaining: Math.max(0, config.requests - count),
      resetTime,
      limit: config.requests
    }

  } catch (error) {
    console.error('Rate limit status check failed:', error)

    return {
      allowed: true,
      remaining: config.requests,
      resetTime: Date.now() + config.windowMs,
      limit: config.requests
    }
  }
}

/**
 * Reset rate limit for a specific key
 * Useful for testing or manual intervention
 *
 * @param key - Unique identifier to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    const client = getRedisClient()
    const pattern = `ratelimit:${key}:*`

    // Note: In production, consider using Redis SCAN for large key sets
    // For now, this is a simple implementation for manual resets
    await client.del(pattern)

  } catch (error) {
    console.error('Rate limit reset failed:', error)
  }
}

/**
 * Health check for Redis connection
 * Returns true if Redis is accessible, false otherwise
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient()
    await client.ping()
    return true
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

/**
 * Pre-configured rate limit configurations
 * Matches existing middleware configurations
 */
export const RATE_LIMITS = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 },      // 5 requests per 15 minutes
  search: { requests: 30, windowMs: 60 * 1000 },        // 30 requests per minute
  general: { requests: 100, windowMs: 60 * 1000 },      // 100 requests per minute
  api: { requests: 50, windowMs: 60 * 1000 },           // 50 requests per minute
  upload: { requests: 10, windowMs: 60 * 1000 },        // 10 uploads per minute
} as const
