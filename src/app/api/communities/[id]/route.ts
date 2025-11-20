import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateCommunityName, validateCommunityDescription, sanitizeInput, validateUUID } from '@/lib/validation'
import { handleAPIError, APIError } from '@/lib/error-handler'
import { getCachedCommunity } from '@/lib/cache'
import type { CommunityDetail } from '@/types/community'

/**
 * GET /api/communities/[id]
 * Get a specific community by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!validateUUID(id)) {
      throw new APIError('Invalid community ID', 400, 'INVALID_ID')
    }

    // Fetch community with caching (5-minute TTL)
    const community = await getCachedCommunity(id, async () => {
      return await prisma.community.findUnique({
        where: { id },
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
          }
        }
      })
    })

    if (!community) {
      throw new APIError('Community not found', 404, 'NOT_FOUND')
    }

    // Get user's membership status if logged in (single query, not cached)
    let membership = null
    if (user) {
      membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: id
          }
        }
      })
    }

    // Check if community is private and user is not a member
    if (!community.isPublic) {
      if (!user || !membership) {
        throw new APIError('Access denied to private community', 403, 'ACCESS_DENIED')
      }
    }

    // Build response with proper typing
    const response: CommunityDetail = {
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
      userRole: membership?.role || null,
      isMember: !!membership
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleAPIError(error, 'GET /api/communities/[id]')
  }
}

/**
 * PATCH /api/communities/[id]
 * Update a community (Owner or Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 }
      )
    }

    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check permissions: must be owner or admin/super admin
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const isOwner = membership?.role === 'OWNER'
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only community owners or administrators can update this community' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, isPublic, coverImage } = body

    // Prepare update data
    const updateData: any = {}

    if (name !== undefined) {
      const nameValidation = validateCommunityName(name)
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        )
      }

      // Check for duplicate name (excluding current community)
      const existingCommunity = await prisma.community.findFirst({
        where: {
          name: {
            equals: sanitizeInput(name),
            mode: 'insensitive'
          },
          NOT: {
            id
          }
        }
      })

      if (existingCommunity) {
        return NextResponse.json(
          { error: 'A community with this name already exists' },
          { status: 409 }
        )
      }

      updateData.name = sanitizeInput(name)
    }

    if (description !== undefined) {
      const descriptionValidation = validateCommunityDescription(description)
      if (!descriptionValidation.isValid) {
        return NextResponse.json(
          { error: descriptionValidation.error },
          { status: 400 }
        )
      }
      updateData.description = description ? sanitizeInput(description) : null
    }

    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic)
    }

    if (coverImage !== undefined) {
      updateData.coverImage = coverImage || null
    }

    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      community: {
        ...updatedCommunity,
        memberCount: updatedCommunity._count.CommunityMember,
        quizCount: updatedCommunity._count.Quiz
      }
    })
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/communities/[id]
 * Delete a community (Owner or Super Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID' },
        { status: 400 }
      )
    }

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Quiz: true
          }
        }
      }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check permissions: must be owner or super admin
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: id
        }
      }
    })

    const isOwner = membership?.role === 'OWNER'
    const isSuperAdmin = user.role === 'SUPER_ADMIN'

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only community owners or super administrators can delete this community' },
        { status: 403 }
      )
    }

    // Delete the community (cascade will handle members and associations)
    await prisma.community.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Community deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting community:', error)
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    )
  }
}
