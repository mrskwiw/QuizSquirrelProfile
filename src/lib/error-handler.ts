import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

/**
 * Custom API Error class for structured error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Centralized error handler for API routes
 *
 * @param error - The error object
 * @param context - Context string for logging (e.g., 'POST /api/communities')
 * @returns NextResponse with appropriate error message and status code
 */
export function handleAPIError(error: unknown, context: string): NextResponse {
  console.error(`[${context}]`, error)

  // TODO: Send to error tracking service (Sentry, etc.)
  // trackError(error, { context })

  // Handle custom API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0]
    return NextResponse.json(
      {
        error: firstError.message,
        code: 'VALIDATION_ERROR',
        field: firstError.path.join('.')
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate entry', code: 'DUPLICATE' },
        { status: 409 }
      )
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference', code: 'INVALID_REFERENCE' },
        { status: 400 }
      )
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: 'Invalid data provided', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  // Generic server error
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}

/**
 * Measure query execution time for performance monitoring
 *
 * @param queryName - Name of the query for logging
 * @param queryFn - Async function to execute
 * @returns Result of the query function
 */
export async function measureQueryTime<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await queryFn()
    const duration = performance.now() - start

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`[Slow Query: ${queryName}] Duration: ${duration.toFixed(2)}ms`)
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Query: ${queryName}] Duration: ${duration.toFixed(2)}ms`)
    }

    // TODO: Send to monitoring service
    // trackMetric('db.query.duration', duration, { query: queryName })

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[Query: ${queryName}] Failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}
