import { unstable_cache } from 'next/cache'

/**
 * Cache configuration for different data types
 */
export const CACHE_TAGS = {
  COMMUNITY: 'community',
  COMMUNITY_LIST: 'community-list',
  COMMUNITY_MEMBERS: 'community-members',
  COMMUNITY_QUIZZES: 'community-quizzes',
} as const

export const CACHE_REVALIDATE = {
  COMMUNITY_DETAIL: 300, // 5 minutes - community details change infrequently
  COMMUNITY_LIST_PUBLIC: 300, // 5 minutes - public list for anonymous users
  COMMUNITY_LIST_USER: 60, // 1 minute - user-specific list (includes membership)
  COMMUNITY_MEMBERS: 600, // 10 minutes - member counts change less frequently
  COMMUNITY_QUIZZES: 120, // 2 minutes - quizzes may be posted more frequently
} as const

/**
 * Cached community detail fetcher
 *
 * @param id - Community ID
 * @param fetchFn - Function to fetch community data
 * @returns Cached community data
 */
export async function getCachedCommunity<T>(
  id: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cachedFetch = unstable_cache(
    fetchFn,
    [`community-detail-${id}`],
    {
      revalidate: CACHE_REVALIDATE.COMMUNITY_DETAIL,
      tags: [CACHE_TAGS.COMMUNITY, `community-${id}`]
    }
  )

  return cachedFetch()
}

/**
 * Cached community list fetcher
 *
 * @param userId - User ID (null for anonymous)
 * @param filters - Query filters as JSON string
 * @param fetchFn - Function to fetch communities
 * @returns Cached communities data
 */
export async function getCachedCommunities<T>(
  userId: string | null,
  filters: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cacheKey = userId
    ? `communities-user-${userId}-${filters}`
    : `communities-public-${filters}`

  const ttl = userId
    ? CACHE_REVALIDATE.COMMUNITY_LIST_USER
    : CACHE_REVALIDATE.COMMUNITY_LIST_PUBLIC

  const cachedFetch = unstable_cache(
    fetchFn,
    [cacheKey],
    {
      revalidate: ttl,
      tags: [CACHE_TAGS.COMMUNITY_LIST]
    }
  )

  return cachedFetch()
}

/**
 * Cache invalidation helpers
 *
 * Note: In production, these would call revalidateTag from 'next/cache'
 * For now, these are placeholders that document the invalidation strategy
 */
export const invalidateCache = {
  /**
   * Invalidate all community caches
   */
  allCommunities: () => {
    // revalidateTag(CACHE_TAGS.COMMUNITY)
    // revalidateTag(CACHE_TAGS.COMMUNITY_LIST)
  },

  /**
   * Invalidate specific community cache
   */
  community: (id: string) => {
    // revalidateTag(`community-${id}`)
  },

  /**
   * Invalidate community list caches
   */
  communityList: () => {
    // revalidateTag(CACHE_TAGS.COMMUNITY_LIST)
  },

  /**
   * Invalidate community members cache
   */
  communityMembers: (id: string) => {
    // revalidateTag(`community-members-${id}`)
  },

  /**
   * Invalidate community quizzes cache
   */
  communityQuizzes: (id: string) => {
    // revalidateTag(`community-quizzes-${id}`)
  }
}

/**
 * Helper to generate stable cache keys from query parameters
 */
export function generateCacheKey(params: Record<string, any>): string {
  // Sort keys for consistency
  const sortedKeys = Object.keys(params).sort()
  const sortedParams = sortedKeys.reduce((acc, key) => {
    acc[key] = params[key]
    return acc
  }, {} as Record<string, any>)

  return JSON.stringify(sortedParams)
}
