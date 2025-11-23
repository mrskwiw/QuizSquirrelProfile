'use client'

import { useState } from 'react'
import { CommunityInvitation } from '@/types/community'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'

interface InvitationCardProps {
  invitation: CommunityInvitation
  onAccept?: (invitationId: string) => Promise<void>
  onDecline?: (invitationId: string) => Promise<void>
  onCancel?: (invitationId: string) => Promise<void>
  showActions?: boolean
  variant?: 'user' | 'community'
}

/**
 * Display a community invitation with action buttons
 * Used both for user's pending invitations and community's invitation management
 */
export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  onCancel,
  showActions = true,
  variant = 'user'
}: InvitationCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState<'accept' | 'decline' | 'cancel' | null>(null)

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isPending = invitation.status === 'PENDING' && !isExpired

  /**
   * Handle invitation acceptance
   */
  const handleAccept = async () => {
    if (!onAccept || isLoading) return

    setIsLoading(true)
    setCurrentAction('accept')
    try {
      await onAccept(invitation.id)
    } finally {
      setIsLoading(false)
      setCurrentAction(null)
    }
  }

  /**
   * Handle invitation decline
   */
  const handleDecline = async () => {
    if (!onDecline || isLoading) return

    setIsLoading(true)
    setCurrentAction('decline')
    try {
      await onDecline(invitation.id)
    } finally {
      setIsLoading(false)
      setCurrentAction(null)
    }
  }

  /**
   * Handle invitation cancellation (community owner/moderator)
   */
  const handleCancel = async () => {
    if (!onCancel || isLoading) return

    setIsLoading(true)
    setCurrentAction('cancel')
    try {
      await onCancel(invitation.id)
    } finally {
      setIsLoading(false)
      setCurrentAction(null)
    }
  }

  /**
   * Get status badge variant based on invitation status
   */
  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="default" className="bg-gray-500">Expired</Badge>
    }

    switch (invitation.status) {
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>
      case 'ACCEPTED':
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>
      case 'DECLINED':
        return <Badge variant="default" className="bg-red-500">Declined</Badge>
      default:
        return <Badge variant="default">{invitation.status}</Badge>
    }
  }

  /**
   * Get role badge variant
   */
  const getRoleBadge = () => {
    if (invitation.role === 'MODERATOR') {
      return <Badge variant="default" className="bg-purple-500">Moderator</Badge>
    }
    return <Badge variant="default" className="bg-blue-500">Member</Badge>
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {variant === 'user' ? (
              <>
                <CardTitle className="text-lg font-semibold">
                  {invitation.community.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Invited by <span className="font-medium">{invitation.inviter.displayName || invitation.inviter.username}</span>
                </p>
              </>
            ) : (
              <>
                <CardTitle className="text-lg font-semibold">
                  {invitation.invitee?.displayName || invitation.invitee?.username || invitation.inviteeEmail}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Invited by {invitation.inviter.displayName || invitation.inviter.username}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            {getStatusBadge()}
            {getRoleBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {variant === 'user' && invitation.community.description && (
          <p className="text-sm text-gray-700 mb-3">
            {invitation.community.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {invitation.status === 'ACCEPTED' && invitation.acceptedAt
              ? `Accepted ${formatDistanceToNow(new Date(invitation.acceptedAt), { addSuffix: true })}`
              : `Invited ${formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}`
            }
          </span>
          {isPending && (
            <span className="text-yellow-600">
              Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {showActions && isPending && (
          <div className="flex gap-2 mt-4">
            {variant === 'user' ? (
              <>
                <Button
                  onClick={handleAccept}
                  variant="primary"
                  className="flex-1"
                  disabled={isLoading}
                  isLoading={isLoading && currentAction === 'accept'}
                >
                  Accept
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                  isLoading={isLoading && currentAction === 'decline'}
                >
                  Decline
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCancel}
                variant="danger"
                className="w-full"
                disabled={isLoading}
                isLoading={isLoading && currentAction === 'cancel'}
              >
                Cancel Invitation
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
