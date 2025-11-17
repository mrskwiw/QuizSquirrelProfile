import { prisma as db } from '@/lib/prisma'

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

/**
 * Check if a user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

/**
 * Check if a user has super admin privileges
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN'
}

/**
 * Require admin role, throw error if not authorized
 */
export function requireAdmin(role: UserRole): void {
  if (!isAdmin(role)) {
    throw new Error('Unauthorized: Admin access required')
  }
}

/**
 * Require super admin role, throw error if not authorized
 */
export function requireSuperAdmin(role: UserRole): void {
  if (!isSuperAdmin(role)) {
    throw new Error('Unauthorized: Super Admin access required')
  }
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  oldValue,
  newValue,
  reason,
}: {
  adminId: string
  action: string
  targetType: string
  targetId?: string
  oldValue?: string
  newValue?: string
  reason?: string
}) {
  try {
    await db.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        oldValue,
        newValue,
        reason,
      },
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - audit logging failure shouldn't block the action
  }
}

/**
 * Check if an email is blocked
 */
export async function isEmailBlocked(email: string): Promise<boolean> {
  const blockedEmail = await db.blockedEmail.findUnique({
    where: { email: email.toLowerCase() },
  })
  return !!blockedEmail
}

/**
 * Check if an email domain is blocked
 */
export async function isEmailDomainBlocked(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false

  const blockedDomain = await db.blockedEmail.findFirst({
    where: { email: `@${domain}` },
  })
  return !!blockedDomain
}
