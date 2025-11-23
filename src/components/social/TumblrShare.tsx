'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * TumblrShare Component
 * Publishes a quiz to a connected Tumblr blog
 */
export interface TumblrShareProps {
  quizId: string
  connectionId?: string // Optional: If not provided, will use user's first active Tumblr connection
  customMessage?: string
  onSuccess?: (postUrl: string) => void
  onError?: (error: string) => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSuccessMessage?: boolean
}

interface TumblrConnection {
  id: string
  tumblrBlogName: string
  isActive: boolean
}

export function TumblrShare({
  quizId,
  connectionId,
  customMessage,
  onSuccess,
  onError,
  variant = 'primary',
  size = 'md',
  className,
  showSuccessMessage = true,
}: TumblrShareProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [hasConnection, setHasConnection] = useState(false)
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(connectionId || null)
  const [blogName, setBlogName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)

  // Check for Tumblr connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/social/connections')
        const data = await response.json()

        if (response.ok && data.connections) {
          const tumblrConnections = data.connections.filter(
            (conn: TumblrConnection) => conn.isActive
          )

          if (tumblrConnections.length > 0) {
            setHasConnection(true)
            // Use provided connectionId or default to first active connection
            const connection = connectionId
              ? tumblrConnections.find((c: TumblrConnection) => c.id === connectionId)
              : tumblrConnections[0]

            if (connection) {
              setActiveConnectionId(connection.id)
              setBlogName(connection.tumblrBlogName)
            }
          }
        }
      } catch (err) {
        console.error('Error checking Tumblr connection:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [connectionId])

  const handlePublish = async () => {
    if (!activeConnectionId) {
      setError('No Tumblr connection found')
      return
    }

    setIsPublishing(true)
    setError(null)
    setSuccessUrl(null)

    try {
      const response = await fetch('/api/social/tumblr/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId,
          connectionId: activeConnectionId,
          customMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish to Tumblr')
      }

      // Success!
      if (data.postUrl) {
        setSuccessUrl(data.postUrl)
      }

      if (onSuccess && data.postUrl) {
        onSuccess(data.postUrl)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to publish to Tumblr'
      setError(errorMessage)

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsPublishing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <svg
          className="mr-2 h-5 w-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading...
      </Button>
    )
  }

  // Not connected state
  if (!hasConnection) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-600 mb-2">
          Connect your Tumblr account to share this quiz
        </p>
        <Button variant="outline" size={size} disabled>
          <svg
            className="mr-2 h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.178l.011.002z" />
          </svg>
          Share to Tumblr
        </Button>
      </div>
    )
  }

  // Success state
  if (successUrl && showSuccessMessage) {
    return (
      <div className={className}>
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Published to Tumblr!
            </p>
            <a
              href={successUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              View on Tumblr →
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Ready to publish state
  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={handlePublish}
        isLoading={isPublishing}
        disabled={isPublishing}
      >
        {isPublishing ? (
          'Publishing...'
        ) : (
          <>
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.178l.011.002z" />
            </svg>
            Share to Tumblr
            {blogName && (
              <span className="ml-1 text-xs opacity-75">({blogName})</span>
            )}
          </>
        )}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
