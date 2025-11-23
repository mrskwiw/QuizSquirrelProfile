/**
 * Test utilities and mocks for community API testing
 */

// Mock Prisma Client
export const mockPrisma = {
  community: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  communityMember: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}

// Mock auth functions
export const mockGetCurrentUser = jest.fn()
export const mockRequireAuth = jest.fn()

// Mock user objects
export const mockAdminUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'admin@example.com',
  username: 'admin',
  displayName: 'Admin User',
  role: 'ADMIN',
  subscriptionTier: 'FREE',
}

export const mockSuperAdminUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'superadmin@example.com',
  username: 'superadmin',
  displayName: 'Super Admin',
  role: 'SUPER_ADMIN',
  subscriptionTier: 'FREE',
}

export const mockRegularUser = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  email: 'user@example.com',
  username: 'user',
  displayName: 'Regular User',
  role: 'USER',
  subscriptionTier: 'FREE',
}

// Mock community objects
export const mockCommunity = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  name: 'Test Community',
  description: 'A test community',
  coverImage: null,
  isPublic: true,
  creatorId: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  User: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'admin',
    displayName: 'Admin User',
    avatarUrl: null,
    role: 'ADMIN',
  },
  _count: {
    CommunityMember: 5,
    Quiz: 10,
  },
}

export const mockPrivateCommunity = {
  ...mockCommunity,
  id: '223e4567-e89b-12d3-a456-426614174001',
  name: 'Private Community',
  isPublic: false,
}

// Mock membership objects
export const mockOwnerMembership = {
  id: '323e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174000',
  communityId: '223e4567-e89b-12d3-a456-426614174000',
  role: 'OWNER',
  joinedAt: new Date('2024-01-01'),
}

export const mockMemberMembership = {
  id: '323e4567-e89b-12d3-a456-426614174001',
  userId: '123e4567-e89b-12d3-a456-426614174002',
  communityId: '223e4567-e89b-12d3-a456-426614174000',
  role: 'MEMBER',
  joinedAt: new Date('2024-01-02'),
}

export const mockModeratorMembership = {
  id: '323e4567-e89b-12d3-a456-426614174002',
  userId: '123e4567-e89b-12d3-a456-426614174003',
  communityId: '223e4567-e89b-12d3-a456-426614174000',
  role: 'MODERATOR',
  joinedAt: new Date('2024-01-03'),
}

// Mock member with user details
export const mockMemberWithUser = {
  ...mockMemberMembership,
  User: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    username: 'user',
    displayName: 'Regular User',
    avatarUrl: null,
    bio: null,
    role: 'USER',
  },
}

// Helper to create mock NextRequest
export function createMockRequest(options: {
  method?: string
  url?: string
  body?: any
  headers?: Record<string, string>
} = {}) {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/communities',
    body,
    headers = {},
  } = options

  const request = {
    method,
    url,
    headers: new Headers(headers),
    json: async () => body,
  } as any

  return request
}

// Helper to reset all mocks
export function resetMocks() {
  Object.values(mockPrisma.community).forEach(fn => fn.mockReset())
  Object.values(mockPrisma.communityMember).forEach(fn => fn.mockReset())
  Object.values(mockPrisma.user).forEach(fn => fn.mockReset())
  mockGetCurrentUser.mockReset()
  mockRequireAuth.mockReset()
}

// Mock NextResponse
export const mockNextResponse = {
  json: (data: any, init?: ResponseInit) => ({
    status: init?.status || 200,
    headers: init?.headers || {},
    data,
  }),
}

// Type helper for async params (Next.js 15)
export async function createMockParams(params: Record<string, string>) {
  return Promise.resolve(params)
}
