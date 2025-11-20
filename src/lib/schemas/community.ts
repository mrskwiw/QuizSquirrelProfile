import { z } from 'zod'

/**
 * Community name validation schema
 */
const communityNameSchema = z
  .string()
  .min(3, 'Community name must be at least 3 characters long')
  .max(50, 'Community name must be no more than 50 characters')
  .regex(
    /^[a-zA-Z0-9\s\-_&!?.,']+$/,
    'Community name contains invalid characters'
  )
  .refine(
    (val) => val === val.trim(),
    { message: 'Community name cannot have leading or trailing spaces' }
  )
  .transform((str: string) => str.trim())

/**
 * Community description validation schema
 */
const communityDescriptionSchema = z
  .string()
  .max(500, 'Community description must be no more than 500 characters')
  .optional()
  .nullable()

/**
 * Create community request schema
 */
export const createCommunitySchema = z.object({
  name: communityNameSchema,
  description: communityDescriptionSchema,
  isPublic: z.boolean().default(true),
  coverImage: z.string().url().optional().nullable()
})

/**
 * Update community request schema (all fields optional)
 */
export const updateCommunitySchema = z.object({
  name: communityNameSchema.optional(),
  description: communityDescriptionSchema,
  isPublic: z.boolean().optional(),
  coverImage: z.string().url().optional().nullable()
})

/**
 * Add member request schema
 */
export const addMemberSchema = z.object({
  userId: z.string().uuid().optional(),
  role: z.enum(['MEMBER', 'MODERATOR']).optional()
})

/**
 * Community query parameters schema
 */
export const communityQuerySchema = z.object({
  search: z.string().optional(),
  isPublic: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

/**
 * Quiz query parameters schema
 */
export const quizQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10)
})

/**
 * Type inference helpers
 */
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>
export type AddMemberInput = z.infer<typeof addMemberSchema>
export type CommunityQueryParams = z.infer<typeof communityQuerySchema>
export type QuizQueryParams = z.infer<typeof quizQuerySchema>
