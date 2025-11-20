import { Prisma } from '@prisma/client'

/**
 * Community query where input type
 */
export type CommunityWhereInput = Prisma.CommunityWhereInput

/**
 * Community with all relations loaded
 */
export type CommunityWithRelations = Prisma.CommunityGetPayload<{
  include: {
    User: {
      select: {
        id: true
        username: true
        displayName: true
        avatarUrl: true
        role: true
      }
    }
    _count: {
      select: {
        CommunityMember: true
        Quiz: true
      }
    }
  }
}>

/**
 * Community with single user membership
 */
export type CommunityWithMembership = Prisma.CommunityGetPayload<{
  include: {
    User: {
      select: {
        id: true
        username: true
        displayName: true
        avatarUrl: true
        role: true
      }
    }
    _count: {
      select: {
        CommunityMember: true
        Quiz: true
      }
    }
    CommunityMember: {
      where: {
        userId: string
      }
      select: {
        role: true
      }
    }
  }
}>

/**
 * Community membership data
 */
export type CommunityMembership = {
  communityId: string
  role: 'OWNER' | 'MODERATOR' | 'MEMBER'
}

/**
 * Community list item with user-specific data
 */
export type CommunityListItem = {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPublic: boolean
  creatorId: string
  createdAt: Date
  updatedAt: Date
  User: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
  memberCount: number
  quizCount: number
  userRole: 'OWNER' | 'MODERATOR' | 'MEMBER' | null
  isMember: boolean
}

/**
 * Community detail with user-specific data
 */
export type CommunityDetail = CommunityListItem
