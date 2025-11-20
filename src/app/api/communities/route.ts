import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateCommunityName, validateCommunityDescription, sanitizeInput } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'
import { createCommunitySchema } from '@/lib/schemas/community'
import type { CommunityWhereInput, CommunityListItem } from '@/types/community'

/**
 * POST /api/communities
 * Create a new community (Admin/Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins and super admins can create communities
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new APIError('Only administrators can create communities', 403, 'FORBIDDEN')
    }

    const body = await request.json()

    // Validate with Zod schema (handles sanitization via transform)
    const validatedData = createCommunitySchema.parse(body) as {
      name: string
      description?: string | null
      isPublic: boolean
      coverImage?: string | null
    }

    // Sanitize inputs to prevent XSS (Zod already trimmed, but we still sanitize)
    const sanitizedName = sanitizeInput(validatedData.name)
    const sanitizedDescription = validatedData.description ? sanitizeInput(validatedData.description) : null

    // Check if community with same name already exists
    const existingCommunity = await prisma.community.findFirst({
      where: {
        name: {
          equals: sanitizedName,
          mode: 'insensitive'
        }
      }
    })

    if (existingCommunity) {
      throw new APIError('A community with this name already exists', 409, 'DUPLICATE')
    }

    // Create the community and add creator as owner in a transaction
    const community = await prisma.$transaction(async (tx) => {
      const newCommunity = await tx.community.create({
        data: {
          name: sanitizedName,
          description: sanitizedDescription,
          isPublic: validatedData.isPublic,
          coverImage: validatedData.coverImage || null,
          creatorId: user.id
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              CommunityMember: true,
              Quiz: true
            }
          }
        }
      })

      // Automatically add the creator as a member with OWNER role
      await tx.communityMember.create({
        data: {
          userId: user.id,
          communityId: newCommunity.id,
          role: 'OWNER'
        }
      })

      return newCommunity
    })

    return NextResponse.json({
      success: true,
      community: {
        ...community,
        memberCount: community._count.CommunityMember + 1, // Include the owner we just added
        quizCount: community._count.Quiz
      }
    }, { status: 201 })
  } catch (error) {
    return handleAPIError(error, 'POST /api/communities')
  }
}

/**
 * GET /api/communities
 * List all communities with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || undefined
    const isPublic = searchParams.get('isPublic') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Build where clause with proper typing
    const where: CommunityWhereInput = {}

    // If user is not logged in, only show public communities
    if (!user) {
      where.isPublic = true
    } else if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get communities with counts and user membership in single query (optimized to prevent N+1)
    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true
            }
          },
          _count: {
            select: {
              CommunityMember: true,
              Quiz: true
            }
          },
          // Include user's membership if logged in (prevents N+1 query)
          ...(user ? {
            CommunityMember: {
              where: {
                userId: user.id
              },
              select: {
                role: true
              },
              take: 1
            }
          } : {})
        }
      }),
      prisma.community.count({ where })
    ])

    // Transform communities to include user-specific data
    const communitiesWithMembership: CommunityListItem[] = communities.map(community => {
      const membership = user && (community as any).CommunityMember?.[0]
      const userRole = membership?.role || null

      return {
        id: community.id,
        name: community.name,
        description: community.description,
        coverImage: community.coverImage,
        isPublic: community.isPublic,
        creatorId: community.creatorId,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
        User: community.User,
        memberCount: community._count.CommunityMember,
        quizCount: community._count.Quiz,
        userRole,
        isMember: userRole !== null
      }
    })

    return NextResponse.json({
      communities: communitiesWithMembership,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleAPIError(error, 'GET /api/communities')
  }
}
