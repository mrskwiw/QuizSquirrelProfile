'use client'

import { useState, useEffect } from 'react'
import { CommunityMember } from '@/types/community'
import { MemberCard } from './MemberCard'
import { Button } from '@/components/ui/Button'

interface MemberListProps {
  communityId: string
  currentUserRole?: 'OWNER' | 'MODERATOR' | 'MEMBER' | null
  currentUserId?: string
  onMembersChange?: () => void
}

/**
 * Display and manage community members
 */
export function MemberList({
  communityId,
  currentUserRole,
  currentUserId,
  onMembersChange
}: MemberListProps) {
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  /**
   * Fetch members from API
   */
  const fetchMembers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/communities/${communityId}/members`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch members')
      }

      setMembers(data.members || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle role change
   */
  const handleRoleChange = async (memberId: string, newRole: 'MEMBER' | 'MODERATOR') => {
    if (!window.confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/members/${memberId}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role')
      }

      // Refresh members list
      await fetchMembers()
      onMembersChange?.()
    } catch (err: any) {
      alert(err.message || 'Failed to update role')
    }
  }

  /**
   * Handle member removal
   */
  const handleRemove = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the community?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/members?userId=${memberId}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      // Refresh members list
      await fetchMembers()
      onMembersChange?.()
    } catch (err: any) {
      alert(err.message || 'Failed to remove member')
    }
  }

  /**
   * Handle ownership transfer
   */
  const handleTransferOwnership = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!window.confirm(
      `Are you sure you want to transfer ownership to ${member.displayName || member.username}? ` +
      'You will be demoted to Moderator.'
    )) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/transfer-ownership`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ newOwnerId: memberId })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer ownership')
      }

      alert('Ownership transferred successfully')

      // Refresh members list and trigger parent refresh
      await fetchMembers()
      onMembersChange?.()
    } catch (err: any) {
      alert(err.message || 'Failed to transfer ownership')
    }
  }

  /**
   * Fetch members on mount
   */
  useEffect(() => {
    fetchMembers()
  }, [communityId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Error loading members</p>
        <p className="text-sm mt-1">{error}</p>
        <Button
          onClick={fetchMembers}
          variant="outline"
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No members found</p>
        </div>
      ) : (
        members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
            onTransferOwnership={handleTransferOwnership}
          />
        ))
      )}
    </div>
  )
}
