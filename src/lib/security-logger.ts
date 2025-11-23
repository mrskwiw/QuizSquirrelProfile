/**
 * Security Event Logger
 *
 * Centralized security event logging for audit trails and incident response.
 * Implements structured logging with severity levels and contextual data.
 *
 * Security events logged:
 * - Authentication attempts (success/failure)
 * - Authorization failures
 * - Rate limiting violations
 * - Social media token operations
 * - Admin actions
 * - Suspicious activity
 *
 * Integration: Can be extended to send logs to external services (Axiom, Datadog, etc.)
 *
 * @module security-logger
 */

/**
 * Security event severity levels
 */
export enum SecurityLevel {
  INFO = 'INFO',       // Normal security events (successful login)
  WARN = 'WARN',       // Suspicious but not critical (rate limit approached)
  ERROR = 'ERROR',     // Security violations (failed auth, unauthorized access)
  CRITICAL = 'CRITICAL' // Severe security incidents (repeated attacks, data breach attempts)
}

/**
 * Security event categories
 */
export enum SecurityCategory {
  AUTH = 'AUTH',                   // Authentication events
  AUTHZ = 'AUTHZ',                 // Authorization events
  RATE_LIMIT = 'RATE_LIMIT',       // Rate limiting events
  SOCIAL = 'SOCIAL',               // Social media integration events
  ADMIN = 'ADMIN',                 // Admin panel actions
  DATA = 'DATA',                   // Data access/modification events
  SYSTEM = 'SYSTEM'                // System-level security events
}

/**
 * Security event structure
 */
export interface SecurityEvent {
  timestamp: string
  level: SecurityLevel
  category: SecurityCategory
  action: string
  userId?: string
  username?: string
  ip?: string
  userAgent?: string
  resource?: string
  status: 'success' | 'failure' | 'blocked'
  details?: Record<string, unknown>
  error?: string
}

/**
 * Security logger configuration
 */
interface LoggerConfig {
  enableConsole: boolean
  enableAxiom: boolean
  axiomToken?: string
  axiomDataset?: string
}

/**
 * Load logger configuration from environment
 */
function getLoggerConfig(): LoggerConfig {
  return {
    enableConsole: process.env.NODE_ENV === 'development',
    enableAxiom: !!process.env.AXIOM_TOKEN,
    axiomToken: process.env.AXIOM_TOKEN,
    axiomDataset: process.env.AXIOM_DATASET || 'quiz-squirrel-security'
  }
}

/**
 * Format security event for console output
 */
function formatConsoleLog(event: SecurityEvent): string {
  const emoji = {
    INFO: 'ℹ️',
    WARN: '⚠️',
    ERROR: '❌',
    CRITICAL: '🚨'
  }[event.level]

  const parts = [
    `${emoji} [${event.level}]`,
    `[${event.category}]`,
    event.action,
    event.userId ? `user=${event.userId}` : null,
    event.ip ? `ip=${event.ip}` : null,
    `status=${event.status}`,
    event.error ? `error="${event.error}"` : null
  ].filter(Boolean)

  return parts.join(' ')
}

/**
 * Send security event to Axiom
 */
async function sendToAxiom(event: SecurityEvent, config: LoggerConfig): Promise<void> {
  if (!config.enableAxiom || !config.axiomToken || !config.axiomDataset) {
    return
  }

  try {
    const response = await fetch(
      `https://api.axiom.co/v1/datasets/${config.axiomDataset}/ingest`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.axiomToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([event])
      }
    )

    if (!response.ok) {
      console.error('Failed to send security log to Axiom:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending security log to Axiom:', error)
  }
}

/**
 * Log a security event
 *
 * @param event - Security event to log
 *
 * @example
 * logSecurityEvent({
 *   timestamp: new Date().toISOString(),
 *   level: SecurityLevel.ERROR,
 *   category: SecurityCategory.AUTH,
 *   action: 'login_failed',
 *   username: 'user@example.com',
 *   ip: '192.168.1.1',
 *   status: 'failure',
 *   details: { reason: 'invalid_password' }
 * })
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const config = getLoggerConfig()

  // Always log to console in development
  if (config.enableConsole) {
    console.log(formatConsoleLog(event))
    if (event.details) {
      console.log('  Details:', JSON.stringify(event.details, null, 2))
    }
  }

  // Send to Axiom in production (if configured)
  if (config.enableAxiom) {
    await sendToAxiom(event, config)
  }

  // In production without Axiom, at least log to console for CloudWatch/Vercel logs
  if (process.env.NODE_ENV === 'production' && !config.enableAxiom) {
    console.log(JSON.stringify(event))
  }
}

/**
 * Helper functions for common security events
 */

/**
 * Log authentication attempt
 */
export async function logAuthAttempt(params: {
  userId?: string
  username?: string
  ip?: string
  userAgent?: string
  success: boolean
  reason?: string
}): Promise<void> {
  await logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: params.success ? SecurityLevel.INFO : SecurityLevel.ERROR,
    category: SecurityCategory.AUTH,
    action: params.success ? 'login_success' : 'login_failed',
    userId: params.userId,
    username: params.username,
    ip: params.ip,
    userAgent: params.userAgent,
    status: params.success ? 'success' : 'failure',
    details: params.reason ? { reason: params.reason } : undefined
  })
}

/**
 * Log authorization failure
 */
export async function logAuthzFailure(params: {
  userId?: string
  username?: string
  ip?: string
  resource: string
  action: string
  reason: string
}): Promise<void> {
  await logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: SecurityLevel.ERROR,
    category: SecurityCategory.AUTHZ,
    action: `unauthorized_${params.action}`,
    userId: params.userId,
    username: params.username,
    ip: params.ip,
    resource: params.resource,
    status: 'blocked',
    details: { reason: params.reason }
  })
}

/**
 * Log rate limit violation
 */
export async function logRateLimitViolation(params: {
  ip: string
  path: string
  limit: number
  remaining: number
}): Promise<void> {
  await logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: SecurityLevel.WARN,
    category: SecurityCategory.RATE_LIMIT,
    action: 'rate_limit_exceeded',
    ip: params.ip,
    resource: params.path,
    status: 'blocked',
    details: {
      limit: params.limit,
      remaining: params.remaining
    }
  })
}

/**
 * Log social media token operation
 */
export async function logSocialTokenOperation(params: {
  userId: string
  operation: 'encrypt' | 'decrypt' | 'refresh' | 'revoke'
  provider: 'facebook' | 'tumblr'
  success: boolean
  error?: string
}): Promise<void> {
  await logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: params.success ? SecurityLevel.INFO : SecurityLevel.ERROR,
    category: SecurityCategory.SOCIAL,
    action: `${params.provider}_token_${params.operation}`,
    userId: params.userId,
    status: params.success ? 'success' : 'failure',
    error: params.error,
    details: {
      provider: params.provider,
      operation: params.operation
    }
  })
}

/**
 * Log admin action
 */
export async function logAdminAction(params: {
  adminId: string
  adminUsername: string
  action: string
  targetUserId?: string
  targetUsername?: string
  resource?: string
  ip?: string
  details?: Record<string, unknown>
}): Promise<void> {
  await logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: SecurityLevel.WARN,
    category: SecurityCategory.ADMIN,
    action: params.action,
    userId: params.adminId,
    username: params.adminUsername,
    ip: params.ip,
    resource: params.resource,
    status: 'success',
    details: {
      ...params.details,
      targetUserId: params.targetUserId,
      targetUsername: params.targetUsername
    }
  })
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(params: {
  userId?: string
  username?: string
  ip?: string
  userAgent?: string
  action: string
  reason: string
  details?: Record<string, unknown>
}): Promise<void> {
  await logSecurityEvent({
    timestamp: new Date().toISOString(),
    level: SecurityLevel.CRITICAL,
    category: SecurityCategory.SYSTEM,
    action: params.action,
    userId: params.userId,
    username: params.username,
    ip: params.ip,
    userAgent: params.userAgent,
    status: 'blocked',
    error: params.reason,
    details: params.details
  })
}

/**
 * Validate security logger is working
 * Useful for testing on application startup
 */
export async function validateSecurityLogger(): Promise<boolean> {
  try {
    await logSecurityEvent({
      timestamp: new Date().toISOString(),
      level: SecurityLevel.INFO,
      category: SecurityCategory.SYSTEM,
      action: 'logger_validation',
      status: 'success',
      details: {
        test: true,
        message: 'Security logger validation test'
      }
    })
    return true
  } catch (error) {
    console.error('Security logger validation failed:', error)
    return false
  }
}
