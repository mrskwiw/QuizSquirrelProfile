'use client'

import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export interface Connection {
  id: string
  platform: 'TUMBLR' | 'FACEBOOK'
  tumblrBlogName?: string | null
  facebookPageId?: string | null
  facebookPageName?: string | null
  isActive: boolean
  lastSyncedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ConnectionCardProps {
  connection: Connection
  onDisconnect?: (connectionId: string) => void
  onRefresh?: (connectionId: string) => void
  className?: string
}

/**
 * ConnectionCard Component
 * Displays a connected social media account with management options
 */
export function ConnectionCard({
  connection,
  onDisconnect,
  onRefresh,
  className,
}: ConnectionCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false)

  const displayName =
    connection.platform === 'TUMBLR'
      ? connection.tumblrBlogName
      : connection.facebookPageName

  const platformIcon =
    connection.platform === 'TUMBLR' ? (
      <svg
        className="h-6 w-6 text-blue-600"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.178l.011.002z" />
      </svg>
    ) : (
      <svg
        className="h-6 w-6 text-blue-600"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )

  const handleDisconnect = async () => {
    if (!showConfirmDisconnect) {
      setShowConfirmDisconnect(true)
      return
    }

    setIsDisconnecting(true)

    try {
      const response = await fetch(
        `/api/social/connections?id=${connection.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      if (onDisconnect) {
        onDisconnect(connection.id)
      }
    } catch (error: any) {
      console.error('Disconnect error:', error)
      alert(error.message || 'Failed to disconnect. Please try again.')
    } finally {
      setIsDisconnecting(false)
      setShowConfirmDisconnect(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // This would call a sync endpoint if we implement one
      if (onRefresh) {
        onRefresh(connection.id)
      }
    } catch (error: any) {
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {platformIcon}
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription className="mt-1">
                {connection.platform === 'TUMBLR' ? 'Tumblr Blog' : 'Facebook Page'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={connection.isActive ? 'success' : 'secondary'}>
            {connection.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Connected:</span>
            <span className="font-medium text-gray-900">
              {formatDate(connection.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last synced:</span>
            <span className="font-medium text-gray-900">
              {formatDate(connection.lastSyncedAt)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        {showConfirmDisconnect ? (
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-gray-600">
              Are you sure? This will delete all associated posts.
            </span>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDisconnect(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnect}
                isLoading={isDisconnecting}
              >
                Confirm
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              Disconnect
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
