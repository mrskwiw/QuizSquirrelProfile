import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock dependencies
jest.mock('@/lib/prisma-rls', () => ({
  prismaRLS: {},
  withUserContext: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/validation', () => ({
  validateUUID: jest.fn(),
}))

import { withUserContext } from '@/lib/prisma-rls'
import { getCurrentUser } from '@/lib/auth'
import { validateUUID } from '@/lib/validation'

const mockWithUserContext = withUserContext as jest.MockedFunction<typeof withUserContext>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockValidateUUID = validateUUID as jest.MockedFunction<typeof validateUUID>

describe('GET /api/quiz/[id]/social-posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (quizId: string) => {
    return new NextRequest(`http://localhost:3000/api/quiz/${quizId}/social-posts`)
  }

  const createMockParams = (id: string) => {
    return { params: Promise.resolve({ id }) }
  }

  it('returns 400 for invalid UUID format', async () => {
    mockValidateUUID.mockReturnValue(false)

    const request = createMockRequest('invalid-id')
    const params = createMockParams('invalid-id')

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid quiz ID format')
  })

  it('returns empty posts array when quiz not found', async () => {
    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest('quiz-123')
    const params = createMockParams('quiz-123')

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Quiz not found')
  })

  it('returns empty posts array when user is not quiz creator', async () => {
    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'quiz-123',
            creatorId: 'different-user',
            status: 'PUBLISHED',
          }),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest('quiz-123')
    const params = createMockParams('quiz-123')

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toEqual([])
  })

  it('returns formatted posts for quiz creator', async () => {
    const userId = 'user-123'
    const quizId = 'quiz-123'

    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    const mockPosts = [
      {
        id: 'post-1',
        quizId,
        connectionId: 'conn-1',
        platform: 'TUMBLR',
        externalPostId: 'tumblr-123',
        externalUrl: 'https://example.tumblr.com/post/123',
        publishedAt: new Date('2024-01-15T10:00:00Z'),
        lastSyncedAt: new Date('2024-01-15T12:00:00Z'),
        likes: 100,
        shares: 50,
        comments: 25,
        views: 1000,
        SocialMediaConnection: {
          platform: 'TUMBLR',
          tumblrBlogName: 'my-blog',
          facebookPageName: null,
        },
      },
    ]

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue({
            id: quizId,
            creatorId: userId,
            status: 'PUBLISHED',
          }),
        },
        socialMediaPost: {
          findMany: jest.fn().mockResolvedValue(mockPosts),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest(quizId)
    const params = createMockParams(quizId)

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toHaveLength(1)
    expect(data.posts[0]).toMatchObject({
      id: 'post-1',
      platform: 'TUMBLR',
      externalUrl: 'https://example.tumblr.com/post/123',
      likes: 100,
      shares: 50,
      comments: 25,
      views: 1000,
      blogName: 'my-blog',
    })
  })

  it('returns posts ordered by publishedAt descending', async () => {
    const userId = 'user-123'
    const quizId = 'quiz-123'

    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    let orderByCalled = false

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue({
            id: quizId,
            creatorId: userId,
            status: 'PUBLISHED',
          }),
        },
        socialMediaPost: {
          findMany: jest.fn().mockImplementation(({ orderBy }) => {
            orderByCalled = true
            expect(orderBy).toEqual({ publishedAt: 'desc' })
            return Promise.resolve([])
          }),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest(quizId)
    const params = createMockParams(quizId)

    await GET(request, params)

    expect(orderByCalled).toBe(true)
  })

  it('uses Facebook page name when available', async () => {
    const userId = 'user-123'
    const quizId = 'quiz-123'

    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    const mockPosts = [
      {
        id: 'post-1',
        quizId,
        connectionId: 'conn-1',
        platform: 'FACEBOOK',
        externalPostId: 'fb-123',
        externalUrl: 'https://facebook.com/posts/123',
        publishedAt: new Date('2024-01-15T10:00:00Z'),
        lastSyncedAt: new Date('2024-01-15T12:00:00Z'),
        likes: 200,
        shares: 100,
        comments: 50,
        views: 2000,
        SocialMediaConnection: {
          platform: 'FACEBOOK',
          tumblrBlogName: null,
          facebookPageName: 'My Facebook Page',
        },
      },
    ]

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue({
            id: quizId,
            creatorId: userId,
            status: 'PUBLISHED',
          }),
        },
        socialMediaPost: {
          findMany: jest.fn().mockResolvedValue(mockPosts),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest(quizId)
    const params = createMockParams(quizId)

    const response = await GET(request, params)
    const data = await response.json()

    expect(data.posts[0].blogName).toBe('My Facebook Page')
  })

  it('handles null externalUrl gracefully', async () => {
    const userId = 'user-123'
    const quizId = 'quiz-123'

    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    const mockPosts = [
      {
        id: 'post-1',
        quizId,
        connectionId: 'conn-1',
        platform: 'TUMBLR',
        externalPostId: 'tumblr-123',
        externalUrl: null,
        publishedAt: new Date('2024-01-15T10:00:00Z'),
        lastSyncedAt: null,
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
        SocialMediaConnection: {
          platform: 'TUMBLR',
          tumblrBlogName: 'test-blog',
          facebookPageName: null,
        },
      },
    ]

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue({
            id: quizId,
            creatorId: userId,
            status: 'PUBLISHED',
          }),
        },
        socialMediaPost: {
          findMany: jest.fn().mockResolvedValue(mockPosts),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest(quizId)
    const params = createMockParams(quizId)

    const response = await GET(request, params)
    const data = await response.json()

    expect(data.posts[0].externalUrl).toBeNull()
  })

  it('returns 500 on database error', async () => {
    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      role: 'USER',
    } as any)

    mockWithUserContext.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest('quiz-123')
    const params = createMockParams('quiz-123')

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch social media posts')
  })

  it('works for unauthenticated users (returns empty)', async () => {
    mockValidateUUID.mockReturnValue(true)
    mockGetCurrentUser.mockResolvedValue(null)

    mockWithUserContext.mockImplementation(async (client, userId, callback) => {
      expect(userId).toBeNull()
      const mockDb = {
        quiz: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'quiz-123',
            creatorId: 'some-user',
            status: 'PUBLISHED',
          }),
        },
      }
      return callback(mockDb as any)
    })

    const request = createMockRequest('quiz-123')
    const params = createMockParams('quiz-123')

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toEqual([])
  })
})
