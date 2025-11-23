/**
 * @jest-environment node
 */

import { POST, GET } from '../route'
import { prisma } from '@/lib/prisma'
import * as auth from '@/lib/auth'
import {
  mockAdminUser,
  mockRegularUser,
  mockCommunity,
  mockPrivateCommunity,
  mockOwnerMembership,
  createMockRequest,
  resetMocks,
} from '@/__tests__/helpers/communityHelpers'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    communityMember: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth')

describe('POST /api/communities', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should create a community when user is admin', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValue(null)

    // Mock the transaction
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        community: {
          create: jest.fn().mockResolvedValue({
            ...mockCommunity,
            _count: { CommunityMember: 0, Quiz: 0 },
          })
        },
        communityMember: {
          create: jest.fn().mockResolvedValue(mockOwnerMembership)
        }
      }
      return callback(mockTx)
    })

    const request = createMockRequest({
      method: 'POST',
      body: {
        name: 'Test Community',
        description: 'A test community',
        isPublic: true,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.community.name).toBe('Test Community')
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('should reject creation when user is not admin', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockRegularUser)

    const request = createMockRequest({
      method: 'POST',
      body: {
        name: 'Test Community',
        description: 'A test community',
        isPublic: true,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Only administrators can create communities')
    expect(prisma.community.create).not.toHaveBeenCalled()
  })

  it('should reject invalid community names', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)

    const invalidNames = [
      { name: 'AB', expectedError: 'Community name must be at least 3 characters long' },
      { name: 'A'.repeat(51), expectedError: 'Community name must be no more than 50 characters' },
      { name: ' Leading Space', expectedError: 'Community name cannot have leading or trailing spaces' },
      { name: 'Invalid<script>', expectedError: 'Community name contains invalid characters' },
    ]

    for (const { name, expectedError } of invalidNames) {
      const request = createMockRequest({
        method: 'POST',
        body: { name, description: 'Test', isPublic: true },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(expectedError)
      expect(prisma.community.create).not.toHaveBeenCalled()
    }
  })

  it('should reject duplicate community names', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValue(mockCommunity)

    const request = createMockRequest({
      method: 'POST',
      body: {
        name: 'Test Community',
        description: 'A test community',
        isPublic: true,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('A community with this name already exists')
    expect(prisma.community.create).not.toHaveBeenCalled()
  })

  it('should sanitize XSS attempts in input', async () => {
    ;(auth.requireAuth as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValue(null)

    let capturedData: any = null
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        community: {
          create: jest.fn().mockImplementation((data) => {
            capturedData = data
            return Promise.resolve({
              ...mockCommunity,
              name: 'Safe Name',
              description: 'Safe description',
              _count: { CommunityMember: 0, Quiz: 0 },
            })
          })
        },
        communityMember: {
          create: jest.fn().mockResolvedValue(mockOwnerMembership)
        }
      }
      return callback(mockTx)
    })

    const request = createMockRequest({
      method: 'POST',
      body: {
        name: 'Test Community',
        description: 'Test<script>alert("xss")</script>',
        isPublic: true,
      },
    })

    await POST(request)

    expect(capturedData.data.description).not.toContain('<script>')
    expect(capturedData.data.description).not.toContain('</script>')
  })
})

describe('GET /api/communities', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should list communities for anonymous users (public only)', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findMany as jest.Mock).mockResolvedValue([
      { ...mockCommunity, _count: { CommunityMember: 5, Quiz: 10 } },
    ])
    ;(prisma.community.count as jest.Mock).mockResolvedValue(1)

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/communities',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.communities).toHaveLength(1)
    expect(data.communities[0].name).toBe('Test Community')
    expect(data.communities[0].isMember).toBe(false)
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    })
  })

  it('should list communities with membership status for logged-in users', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findMany as jest.Mock).mockResolvedValue([
      {
        ...mockCommunity,
        _count: { CommunityMember: 5, Quiz: 10 },
        CommunityMember: [{ role: 'MEMBER' }]  // Include membership in the community object
      },
    ])
    ;(prisma.community.count as jest.Mock).mockResolvedValue(1)

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/communities',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.communities[0].isMember).toBe(true)
    expect(data.communities[0].userRole).toBe('MEMBER')
  })

  it('should support search filtering', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.community.count as jest.Mock).mockResolvedValue(0)

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/communities?search=quiz',
    })

    await GET(request)

    const findManyCall = (prisma.community.findMany as jest.Mock).mock.calls[0][0]
    expect(findManyCall.where.OR).toBeDefined()
    expect(findManyCall.where.OR[0].name.contains).toBe('quiz')
  })

  it('should support pagination', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.community.count as jest.Mock).mockResolvedValue(50)

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/communities?page=2&limit=10',
    })

    const response = await GET(request)
    const data = await response.json()

    const findManyCall = (prisma.community.findMany as jest.Mock).mock.calls[0][0]
    expect(findManyCall.skip).toBe(10) // (page 2 - 1) * 10
    expect(findManyCall.take).toBe(10)
    expect(data.pagination.totalPages).toBe(5) // 50 / 10
  })

  it('should filter by isPublic parameter', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.community.count as jest.Mock).mockResolvedValue(0)

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/communities?isPublic=true',
    })

    await GET(request)

    const findManyCall = (prisma.community.findMany as jest.Mock).mock.calls[0][0]
    expect(findManyCall.where.isPublic).toBe(true)
  })
})
