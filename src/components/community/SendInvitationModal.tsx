'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface SendInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  communityId: string
  communityName: string
  onSuccess?: () => void
}

/**
 * Modal for sending community invitations
 * Supports inviting by user ID or email with role selection
 */
export function SendInvitationModal({
  isOpen,
  onClose,
  communityId,
  communityName,
  onSuccess
}: SendInvitationModalProps) {
  const [inviteeId, setInviteeId] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [role, setRole] = useState<'MEMBER' | 'MODERATOR'>('MEMBER')
  const [inviteType, setInviteType] = useState<'user' | 'email'>('user')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const body: any = { role }

      if (inviteType === 'user') {
        if (!inviteeId.trim()) {
          throw new Error('Please enter a user ID')
        }
        body.inviteeId = inviteeId.trim()
      } else {
        if (!inviteeEmail.trim()) {
          throw new Error('Please enter an email address')
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(inviteeEmail.trim())) {
          throw new Error('Please enter a valid email address')
        }
        body.inviteeEmail = inviteeEmail.trim()
      }

      const response = await fetch(`/api/communities/${communityId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      setInviteeId('')
      setInviteeEmail('')
      setRole('MEMBER')

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Close modal after short delay to show success message
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (isSubmitting) return
    setInviteeId('')
    setInviteeEmail('')
    setRole('MEMBER')
    setError('')
    setSuccess(false)
    setInviteType('user')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Invite to {communityName}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
              Invitation sent successfully!
            </div>
          )}

          {/* Invite Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite by
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inviteType"
                  value="user"
                  checked={inviteType === 'user'}
                  onChange={(e) => setInviteType('user')}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">User ID</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inviteType"
                  value="email"
                  checked={inviteType === 'email'}
                  onChange={(e) => setInviteType('email')}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Email</span>
              </label>
            </div>
          </div>

          {/* User ID or Email Input */}
          {inviteType === 'user' ? (
            <div>
              <label htmlFor="inviteeId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID *
              </label>
              <input
                type="text"
                id="inviteeId"
                value={inviteeId}
                onChange={(e) => setInviteeId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter user ID"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                The user must have an account to receive the invitation
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="inviteeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="inviteeEmail"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                They'll need to create an account to accept the invitation
              </p>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'MEMBER' | 'MODERATOR')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="MEMBER">Member</option>
              <option value="MODERATOR">Moderator</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'MODERATOR'
                ? 'Moderators can invite and remove members'
                : 'Members have basic community access'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
