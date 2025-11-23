'use client'

import { useState, useEffect } from 'react'
import { CommunityInvitation } from '@/types/community'
import { InvitationCard } from './InvitationCard'
import { Button } from '@/components/ui/Button'

interface InvitationListProps {
  communityId?: string
  variant?: 'user' | 'community'
  statusFilter?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'all'
}

/**
 * Display a list of invitations
 * Can show user's invitations or community's invitations based on variant
 */
export function InvitationList({
  communityId,
  variant = 'user',
  statusFilter = 'PENDING'
}: InvitationListProps) {
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentFilter, setCurrentFilter] = useState(statusFilter)

  /**
   * Fetch invitations from API
   */
  const fetchInvitations = async () => {
    setIsLoading(true)
    setError('')

    try {
      let url = ''

      if (variant === 'user') {
        // Fetch user's invitations
        url = `/api/invitations?status=${currentFilter !== 'all' ? currentFilter : ''}`
      } else if (variant === 'community' && communityId) {
        // Fetch community's invitations
        url = `/api/communities/${communityId}/invitations?status=${currentFilter !== 'all' ? currentFilter : ''}`
      } else {
        throw new Error('Invalid configuration')
      }

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitations')
      }

      setInvitations(data.invitations || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle invitation acceptance
   */
  const handleAccept = async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId)
      if (!invitation) return

      const response = await fetch(
        `/api/communities/${invitation.communityId}/invitations/${invitationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'accept' })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      // Refresh invitations list
      await fetchInvitations()
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation')
    }
  }

  /**
   * Handle invitation decline
   */
  const handleDecline = async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId)
      if (!invitation) return

      const response = await fetch(
        `/api/communities/${invitation.communityId}/invitations/${invitationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'decline' })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline invitation')
      }

      // Refresh invitations list
      await fetchInvitations()
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation')
    }
  }

  /**
   * Handle invitation cancellation (community variant)
   */
  const handleCancel = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    try {
      const invitation = invitations.find(inv => inv.id === invitationId)
      if (!invitation) return

      const response = await fetch(
        `/api/communities/${invitation.communityId}/invitations/${invitationId}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation')
      }

      // Refresh invitations list
      await fetchInvitations()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invitation')
    }
  }

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilter: typeof currentFilter) => {
    setCurrentFilter(newFilter)
  }

  /**
   * Fetch invitations on mount and when filter changes
   */
  useEffect(() => {
    fetchInvitations()
  }, [currentFilter, communityId, variant])

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
        <p className="font-medium">Error loading invitations</p>
        <p className="text-sm mt-1">{error}</p>
        <Button
          onClick={fetchInvitations}
          variant="outline"
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleFilterChange('PENDING')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentFilter === 'PENDING'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => handleFilterChange('ACCEPTED')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentFilter === 'ACCEPTED'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Accepted
        </button>
        <button
          onClick={() => handleFilterChange('DECLINED')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentFilter === 'DECLINED'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Declined
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentFilter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
      </div>

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {currentFilter === 'PENDING'
              ? 'No pending invitations'
              : `No ${currentFilter.toLowerCase()} invitations`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              onAccept={variant === 'user' ? handleAccept : undefined}
              onDecline={variant === 'user' ? handleDecline : undefined}
              onCancel={variant === 'community' ? handleCancel : undefined}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  )
}
