/**
 * @jest-environment node
 */

import { GET, PATCH, DELETE } from '../route'
import { prisma } from '@/lib/prisma'
import * as auth from '@/lib/auth'
import {
  mockAdminUser,
  mockRegularUser,
  mockSuperAdminUser,
  mockCommunity,
  mockPrivateCommunity,
  mockOwnerMembership,
  mockMemberMembership,
  createMockRequest,
  resetMocks,
} from '@/__tests__/helpers/communityHelpers'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    communityMember: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth')

// Mock the cache module to bypass Next.js unstable_cache in tests
jest.mock('@/lib/cache', () => ({
  getCachedCommunity: jest.fn((id: string, fetchFn: () => any) => fetchFn()),
  CACHE_TAGS: {
    COMMUNITY: 'community',
    COMMUNITY_LIST: 'community-list',
  },
  CACHE_REVALIDATE: {
    COMMUNITY_DETAIL: 300,
    COMMUNITY_LIST_PUBLIC: 300,
    COMMUNITY_LIST_USER: 60,
  },
}))

describe('GET /api/communities/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return community details for public community', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      _count: { CommunityMember: 5, Quiz: 10 },
    })

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Test Community')
    expect(data.memberCount).toBe(5)
    expect(data.quizCount).toBe(10)
  })

  it('should return 404 for non-existent community', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const params = Promise.resolve({ id: '999e4567-e89b-12d3-a456-426614174999' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Community not found')
  })

  it('should reject access to private community for non-members', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockPrivateCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockPrivateCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Access denied to private community')
  })

  it('should allow member access to private community', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue({
      ...mockPrivateCommunity,
      _count: { CommunityMember: 5, Quiz: 10 },
    })
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockPrivateCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Private Community')
    expect(data.isMember).toBe(true)
    expect(data.userRole).toBe('MEMBER')
  })

  it('should reject invalid UUID', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const params = Promise.resolve({ id: 'invalid-uuid' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid community ID')
  })
})

describe('PATCH /api/communities/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should allow owner to update community', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockOwnerMembership)
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.update as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      name: 'Updated Community',
      _count: { CommunityMember: 5, Quiz: 10 },
    })

    const request = createMockRequest({
      method: 'PATCH',
      body: {
        name: 'Updated Community',
        description: 'Updated description',
      },
    })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.community.name).toBe('Updated Community')
  })

  it('should allow admin to update any community', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.update as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      isPublic: false,
      _count: { CommunityMember: 5, Quiz: 10 },
    })

    const request = createMockRequest({
      method: 'PATCH',
      body: { isPublic: false },
    })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject update from non-owner regular user', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)

    const request = createMockRequest({
      method: 'PATCH',
      body: { name: 'Hacked Community' },
    })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Only community owners or administrators can update this community')
    expect(prisma.community.update).not.toHaveBeenCalled()
  })

  it('should reject duplicate community names', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockOwnerMembership)
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValue({ id: 'other-community' })

    const request = createMockRequest({
      method: 'PATCH',
      body: { name: 'Existing Community Name' },
    })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('A community with this name already exists')
  })
})

describe('DELETE /api/communities/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should allow owner to delete community', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      _count: { Quiz: 0 },
    })
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockOwnerMembership)
    ;(prisma.community.delete as jest.Mock).mockResolvedValue(mockCommunity)

    const request = createMockRequest({ method: 'DELETE' })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Community deleted successfully')
    expect(prisma.community.delete).toHaveBeenCalled()
  })

  it('should allow super admin to delete any community', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockSuperAdminUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      _count: { Quiz: 0 },
    })
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.delete as jest.Mock).mockResolvedValue(mockCommunity)

    const request = createMockRequest({ method: 'DELETE' })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject deletion from non-owner regular user', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      _count: { Quiz: 0 },
    })
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)

    const request = createMockRequest({ method: 'DELETE' })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Only community owners or super administrators can delete this community')
    expect(prisma.community.delete).not.toHaveBeenCalled()
  })

  it('should reject deletion by admin (not super admin)', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue({
      ...mockCommunity,
      creatorId: 'someone-else',
      _count: { Quiz: 0 },
    })
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)

    const request = createMockRequest({ method: 'DELETE' })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Only community owners or super administrators can delete this community')
  })
})
