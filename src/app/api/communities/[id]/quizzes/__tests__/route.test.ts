/**
 * @jest-environment node
 */

import { GET } from '../route'
import { prisma } from '@/lib/prisma'
import * as auth from '@/lib/auth'
import {
  mockRegularUser,
  mockCommunity,
  mockPrivateCommunity,
  mockMemberMembership,
  createMockRequest,
  resetMocks,
} from '@/__tests__/helpers/communityHelpers'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    community: {
      findUnique: jest.fn(),
    },
    communityMember: {
      findUnique: jest.fn(),
    },
    quiz: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    quizLike: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth')

// Mock quiz data
const mockQuiz = {
  id: '111e4567-e89b-12d3-a456-426614174000',
  title: 'Test Quiz',
  description: 'A test quiz',
  status: 'PUBLISHED',
  userId: mockRegularUser.id,
  communityId: mockCommunity.id,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  User: {
    id: mockRegularUser.id,
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
  },
  _count: {
    QuizResponse: 5,
    QuizLike: 3,
    Comment: 2,
  },
}

describe('GET /api/communities/[id]/quizzes', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return 400 for invalid community ID', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)

    const request = createMockRequest()
    const params = Promise.resolve({ id: 'invalid-uuid' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid community ID')
  })

  it('should return 404 for non-existent community', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const params = Promise.resolve({ id: '999e4567-e89b-12d3-a456-426614174999' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Community not found')
  })

  it('should return 401 if user is not logged in', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(null)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('You must be logged in to view community content')
  })

  it('should return 403 if user is not a member', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('You must be a member to view this community feed')
  })

  it('should return quizzes for community members', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.quizzes).toHaveLength(1)
    expect(data.quizzes[0].title).toBe('Test Quiz')
    expect(data.quizzes[0].responseCount).toBe(5)
    expect(data.quizzes[0].likeCount).toBe(3)
    expect(data.quizzes[0].commentCount).toBe(2)
    expect(data.quizzes[0].isLiked).toBe(false)
  })

  it('should filter quizzes by communityId', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    await GET(request, { params })

    // Verify that findMany was called with correct where clause
    expect(prisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          communityId: mockCommunity.id,
          status: 'PUBLISHED',
        },
      })
    )
  })

  it('should only return PUBLISHED quizzes', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    await GET(request, { params })

    expect(prisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PUBLISHED',
        }),
      })
    )
  })

  it('should mark quizzes as liked if user has liked them', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([
      { quizId: mockQuiz.id, userId: mockRegularUser.id },
    ])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.quizzes[0].isLiked).toBe(true)
  })

  it('should handle pagination parameters', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(25)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest({
      url: `http://localhost:3000/api/communities/${mockCommunity.id}/quizzes?page=2&limit=10`,
    })
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    })

    // Verify skip and take were calculated correctly
    expect(prisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
      })
    )
  })

  it('should use default pagination values when not specified', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(5)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 5,
      totalPages: 1,
    })
  })

  it('should order quizzes by createdAt descending', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    await GET(request, { params })

    expect(prisma.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          createdAt: 'desc',
        },
      })
    )
  })

  it('should include user information with quizzes', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValue(mockCommunity)
    ;(prisma.communityMember.findUnique as jest.Mock).mockResolvedValue(mockMemberMembership)
    ;(prisma.quiz.findMany as jest.Mock).mockResolvedValue([mockQuiz])
    ;(prisma.quiz.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.quizLike.findMany as jest.Mock).mockResolvedValue([])

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.quizzes[0]).toHaveProperty('User')
    expect(data.quizzes[0].User).toEqual({
      id: mockRegularUser.id,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
    })
  })

  it('should handle errors gracefully', async () => {
    ;(auth.getCurrentUser as jest.Mock).mockResolvedValue(mockRegularUser)
    ;(prisma.community.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const request = createMockRequest()
    const params = Promise.resolve({ id: mockCommunity.id })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch community quizzes')
  })
})
