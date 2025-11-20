'use client'

import Link from 'next/link'
import Image from 'next/image'

interface CommunityCardProps {
  community: {
    id: string
    name: string
    description: string | null
    coverImage: string | null
    isPublic: boolean
    memberCount: number
    quizCount: number
    User: {
      username: string
      displayName: string
      avatarUrl: string | null
      role: string
    }
    userRole?: string | null
    isMember?: boolean
  }
}

export default function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${community.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
        {community.coverImage ? (
          <Image
            src={community.coverImage}
            alt={community.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {community.name}
            </h3>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <span>by {community.User.displayName}</span>
              {community.User.role !== 'USER' && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {community.User.role}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-1">
            {!community.isPublic && (
              <span className="text-gray-400" title="Private community">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
            )}
            {community.isMember && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Member
              </span>
            )}
            {community.userRole === 'OWNER' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Owner
              </span>
            )}
            {community.userRole === 'MODERATOR' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Moderator
              </span>
            )}
          </div>
        </div>

        {community.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {community.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{community.quizCount} {community.quizCount === 1 ? 'quiz' : 'quizzes'}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
