'use client'

import { CommunityActivity } from '@/types/community'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ActivityItemProps {
  activity: CommunityActivity
}

/**
 * Display a single community activity item
 * Formats the activity based on type and metadata
 */
export function ActivityItem({ activity }: ActivityItemProps) {
  const { User, activityType, metadata, createdAt } = activity

  /**
   * Get activity icon based on type
   */
  const getActivityIcon = () => {
    switch (activityType) {
      case 'MEMBER_JOINED':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        )
      case 'MEMBER_LEFT':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
          </div>
        )
      case 'QUIZ_POSTED':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )
      case 'QUIZ_DELETED':
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        )
      case 'ROLE_CHANGED':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        )
      case 'COMMUNITY_UPDATED':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  /**
   * Get activity description based on type and metadata
   */
  const getActivityDescription = () => {
    const userName = User.displayName || User.username

    switch (activityType) {
      case 'MEMBER_JOINED':
        if (metadata?.addedBy === 'self') {
          return (
            <>
              <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
                {userName}
              </Link>
              <span className="text-gray-700"> joined the community</span>
            </>
          )
        } else if (metadata?.invitationAccepted) {
          return (
            <>
              <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
                {userName}
              </Link>
              <span className="text-gray-700"> accepted an invitation and joined</span>
            </>
          )
        } else {
          return (
            <>
              <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
                {userName}
              </Link>
              <span className="text-gray-700"> was added to the community</span>
            </>
          )
        }

      case 'MEMBER_LEFT':
        if (metadata?.removedBy === 'self') {
          return (
            <>
              <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
                {userName}
              </Link>
              <span className="text-gray-700"> left the community</span>
            </>
          )
        } else {
          return (
            <>
              <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
                {userName}
              </Link>
              <span className="text-gray-700"> was removed from the community</span>
            </>
          )
        }

      case 'QUIZ_POSTED':
        return (
          <>
            <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
              {userName}
            </Link>
            <span className="text-gray-700"> posted a quiz</span>
            {metadata?.quizTitle && (
              <span className="text-gray-900 font-medium">: {metadata.quizTitle}</span>
            )}
          </>
        )

      case 'QUIZ_DELETED':
        return (
          <>
            <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
              {userName}
            </Link>
            <span className="text-gray-700"> removed a quiz</span>
            {metadata?.quizTitle && (
              <span className="text-gray-900">: {metadata.quizTitle}</span>
            )}
          </>
        )

      case 'ROLE_CHANGED':
        const oldRole = metadata?.oldRole || 'MEMBER'
        const newRole = metadata?.newRole || 'MEMBER'
        const roleChange = oldRole === 'OWNER' ? 'transferred ownership to' :
                          newRole === 'OWNER' ? 'received ownership from' :
                          newRole === 'MODERATOR' ? 'was promoted to moderator' :
                          'was changed to member'

        return (
          <>
            <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
              {userName}
            </Link>
            <span className="text-gray-700"> {roleChange}</span>
          </>
        )

      case 'COMMUNITY_UPDATED':
        return (
          <>
            <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
              {userName}
            </Link>
            <span className="text-gray-700"> updated the community settings</span>
          </>
        )

      default:
        return (
          <>
            <Link href={`/profile/${User.username}`} className="font-medium text-blue-600 hover:underline">
              {userName}
            </Link>
            <span className="text-gray-700"> performed an action</span>
          </>
        )
    }
  }

  return (
    <div className="flex gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      {getActivityIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {getActivityDescription()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
