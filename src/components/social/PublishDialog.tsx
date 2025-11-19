'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TumblrConnect } from './TumblrConnect'
import type { Connection } from './ConnectionCard'

export interface PublishDialogProps {
  open: boolean
  onClose: () => void
  quizId: string
  quizTitle: string
  onSuccess?: (result: { postId: string; postUrl?: string }) => void
}

/**
 * PublishDialog Component
 * Modal for publishing a quiz to connected social media accounts
 */
export function PublishDialog({
  open,
  onClose,
  quizId,
  quizTitle,
  onSuccess,
}: PublishDialogProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch connections when dialog opens
  useEffect(() => {
    if (open) {
      fetchConnections()
      setCustomMessage(quizTitle) // Default to quiz title
      setError(null)
      setSuccessMessage(null)
    }
  }, [open, quizTitle])

  const fetchConnections = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/social/connections')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch connections')
      }

      const activeConnections = data.connections.filter(
        (conn: Connection) => conn.isActive
      )
      setConnections(activeConnections)

      // Auto-select first connection
      if (activeConnections.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(activeConnections[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!selectedConnectionId) {
      setError('Please select a connection')
      return
    }

    setIsPublishing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/social/tumblr/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId,
          connectionId: selectedConnectionId,
          customMessage: customMessage.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish quiz')
      }

      setSuccessMessage('Quiz published successfully!')

      if (onSuccess && data.postId) {
        onSuccess({
          postId: data.postId,
          postUrl: data.postUrl,
        })
      }

      // Close dialog after short delay
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to publish quiz')
    } finally {
      setIsPublishing(false)
    }
  }

  const selectedConnection = connections.find(
    (conn) => conn.id === selectedConnectionId
  )

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Share Quiz to Social Media</DialogTitle>
        <DialogDescription>
          Share &quot;{quizTitle}&quot; with your followers
        </DialogDescription>
      </DialogHeader>

      <DialogContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : connections.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You haven&apos;t connected any social media accounts yet.
            </p>
            <TumblrConnect
              variant="primary"
              onSuccess={() => {
                fetchConnections()
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Selector */}
            <div>
              <label
                htmlFor="connection"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Select Account
              </label>
              <select
                id="connection"
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {connections.map((connection) => {
                  const displayName =
                    connection.platform === 'TUMBLR'
                      ? connection.tumblrBlogName
                      : connection.facebookPageName
                  return (
                    <option key={connection.id} value={connection.id}>
                      {connection.platform} - {displayName}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Custom Message */}
            <div>
              <label
                htmlFor="customMessage"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Custom Message (Optional)
              </label>
              <Input
                id="customMessage"
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={quizTitle}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to use the quiz title
              </p>
            </div>

            {/* Preview */}
            {selectedConnection && (
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-700">Preview:</p>
                <p className="mt-1 text-sm text-gray-900">
                  {customMessage || quizTitle}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Publishing to:{' '}
                  {selectedConnection.platform === 'TUMBLR'
                    ? selectedConnection.tumblrBlogName
                    : selectedConnection.facebookPageName}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {connections.length > 0 && (
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePublish}
            isLoading={isPublishing}
            disabled={isPublishing || !selectedConnectionId}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  )
}
