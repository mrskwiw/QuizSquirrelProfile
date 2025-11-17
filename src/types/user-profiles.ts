/**
 * User Profile Types
 *
 * Defines safe types for exposing user data in API responses.
 * These types align with the database views created for secure data exposure.
 */

import { User } from '@prisma/client'

/**
 * Public user profile - safe for public display
 * Corresponds to the public_profiles database view
 *
 * Excludes sensitive fields:
 * - email
 * - password
 * - subscriptionTier
 * - updatedAt
 */
export type PublicUserProfile = Pick<
  User,
  'id' | 'username' | 'displayName' | 'avatarUrl' | 'bio' | 'role' | 'createdAt'
>

/**
 * Full user profile - includes all non-sensitive fields
 * Used when a user views their own profile
 * Corresponds to the full_user_profiles database view
 *
 * Excludes only:
 * - password
 */
export type FullUserProfile = Omit<User, 'password'>

/**
 * Admin user profile - includes subscription info for admins
 * Used when admins view user profiles
 */
export type AdminUserProfile = Omit<User, 'password'>

/**
 * Minimal user info - for embedded references (e.g., quiz creator)
 */
export type MinimalUserInfo = Pick<
  User,
  'id' | 'username' | 'displayName' | 'avatarUrl'
>

/**
 * User profile with stats - for profile pages
 */
export interface UserProfileWithStats extends PublicUserProfile {
  stats: {
    quizCount: number
    followerCount: number
    followingCount: number
    totalViews?: number
    totalLikes?: number
  }
}

/**
 * Converts a full User object to a PublicUserProfile
 * Use this to sanitize user data before sending to client
 *
 * @param user - Full user object from database
 * @returns Public profile safe for API response
 */
export function toPublicProfile(user: User): PublicUserProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
  }
}

/**
 * Converts a full User object to a FullUserProfile
 * Use this when user is viewing their own profile
 *
 * @param user - Full user object from database
 * @returns Full profile (excluding password)
 */
export function toFullProfile(user: User): FullUserProfile {
  const { password, ...profile } = user
  return profile
}

/**
 * Converts a full User object to appropriate profile based on viewer
 *
 * @param user - User to convert
 * @param viewerId - ID of user viewing the profile (null for anonymous)
 * @param viewerIsAdmin - Whether viewer is an admin
 * @returns Appropriate profile type
 */
export function toAppropriateProfile(
  user: User,
  viewerId: string | null,
  viewerIsAdmin: boolean = false
): PublicUserProfile | FullUserProfile | AdminUserProfile {
  // If viewer is the user themselves, return full profile
  if (viewerId && viewerId === user.id) {
    return toFullProfile(user)
  }

  // If viewer is admin, return admin profile (includes subscription)
  if (viewerIsAdmin) {
    return toFullProfile(user) // Admin sees everything except password
  }

  // Otherwise, return public profile
  return toPublicProfile(user)
}

/**
 * Converts array of users to public profiles
 *
 * @param users - Array of user objects
 * @returns Array of public profiles
 */
export function toPublicProfiles(users: User[]): PublicUserProfile[] {
  return users.map(toPublicProfile)
}

/**
 * Extracts minimal user info for embedded references
 *
 * @param user - User object
 * @returns Minimal user info
 */
export function toMinimalInfo(user: User): MinimalUserInfo {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }
}

/**
 * Type guard to check if a profile is a FullUserProfile
 */
export function isFullProfile(
  profile: PublicUserProfile | FullUserProfile
): profile is FullUserProfile {
  return 'email' in profile
}

/**
 * Type guard to check if a profile includes subscription info
 */
export function hasSubscriptionInfo(
  profile: PublicUserProfile | FullUserProfile | AdminUserProfile
): profile is AdminUserProfile | FullUserProfile {
  return 'subscriptionTier' in profile
}

/**
 * Sanitizes a user object for API response based on context
 * This is the main function to use in API routes
 *
 * @param user - User from database
 * @param context - Viewing context
 * @returns Sanitized user profile
 */
export function sanitizeUserForAPI(
  user: User,
  context: {
    viewerId: string | null | undefined
    viewerRole?: string
  }
): PublicUserProfile | FullUserProfile {
  const isOwner = context.viewerId && context.viewerId === user.id
  const isAdmin = context.viewerRole === 'ADMIN'

  return toAppropriateProfile(user, context.viewerId || null, isAdmin)
}

/**
 * Sanitizes an array of users for API response
 *
 * @param users - Users from database
 * @param context - Viewing context
 * @returns Array of sanitized profiles
 */
export function sanitizeUsersForAPI(
  users: User[],
  context: {
    viewerId: string | null | undefined
    viewerRole?: string
  }
): (PublicUserProfile | FullUserProfile)[] {
  return users.map(user => sanitizeUserForAPI(user, context))
}
