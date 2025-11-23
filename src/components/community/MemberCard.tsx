'use client'

import { useState } from 'react'
import { CommunityMember } from '@/types/community'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface MemberCardProps {
  member: CommunityMember
  currentUserRole?: 'OWNER' | 'MODERATOR' | 'MEMBER' | null
  currentUserId?: string
  onRoleChange?: (memberId: string, newRole: 'MEMBER' | 'MODERATOR') => void
  onRemove?: (memberId: string) => void
  onTransferOwnership?: (memberId: string) => void
}

/**
 * Display a community member with management actions
 */
export function MemberCard({
  member,
  currentUserRole,
  currentUserId,
  onRoleChange,
  onRemove,
  onTransferOwnership
}: MemberCardProps) {
  const [showActions, setShowActions] = useState(false)

  const isCurrentUser = member.id === currentUserId
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'MODERATOR'
  const canChangeRole = currentUserRole === 'OWNER' && member.communityRole !== 'OWNER' && !isCurrentUser
  const canRemove = canManage && member.communityRole !== 'OWNER' && !isCurrentUser
  const canTransferOwnership = currentUserRole === 'OWNER' && !isCurrentUser && member.communityRole !== 'OWNER'

  /**
   * Get role badge component
   */
  const getRoleBadge = () => {
    switch (member.communityRole) {
      case 'OWNER':
        return <Badge variant="default" className="bg-yellow-500">Owner</Badge>
      case 'MODERATOR':
        return <Badge variant="default" className="bg-purple-500">Moderator</Badge>
      case 'MEMBER':
        return <Badge variant="default" className="bg-blue-500">Member</Badge>
      default:
        return null
    }
  }

  return (
    <div className="relative group">
      <Link
        href={`/profile/${member.username}`}
        className="flex items-center space-x-3 hover:bg-gray-50 p-3 rounded-lg transition-colors"
      >
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.displayName || member.username}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-semibold">
              {(member.displayName || member.username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {member.displayName || member.username}
            </p>
            {getRoleBadge()}
            {isCurrentUser && (
              <span className="text-xs text-gray-500">(You)</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            @{member.username} • Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
          </p>
        </div>

        {/* Management Actions Button */}
        {canManage && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </Link>

      {/* Actions Dropdown */}
      {showActions && canManage && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          {canChangeRole && (
            <>
              {member.communityRole === 'MEMBER' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRoleChange?.(member.id, 'MODERATOR')
                    setShowActions(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Promote to Moderator
                </button>
              )}
              {member.communityRole === 'MODERATOR' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRoleChange?.(member.id, 'MEMBER')
                    setShowActions(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Demote to Member
                </button>
              )}
            </>
          )}

          {canTransferOwnership && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTransferOwnership?.(member.id)
                setShowActions(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer Ownership
            </button>
          )}

          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.(member.id)
                setShowActions(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Member
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Click Outside Handler */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  )
}
