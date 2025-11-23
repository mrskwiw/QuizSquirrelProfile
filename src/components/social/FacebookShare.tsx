'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * FacebookShare Component
 * Publishes a quiz to a connected Facebook Page
 */
export interface FacebookShareProps {
  quizId: string
  connectionId?: string // Optional: If not provided, will use user's first active Facebook connection
  customMessage?: string
  onSuccess?: (postUrl: string) => void
  onError?: (error: string) => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSuccessMessage?: boolean
}

interface FacebookConnection {
  id: string
  platform: 'TUMBLR' | 'FACEBOOK'
  facebookPageName: string | null
  isActive: boolean
}

export function FacebookShare({
  quizId,
  connectionId,
  customMessage,
  onSuccess,
  onError,
  variant = 'primary',
  size = 'md',
  className,
  showSuccessMessage = true,
}: FacebookShareProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [hasConnection, setHasConnection] = useState(false)
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(connectionId || null)
  const [pageName, setPageName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)

  // Check for Facebook connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/social/connections')
        const data = await response.json()

        if (response.ok && data.connections) {
          const facebookConnections = data.connections.filter(
            (conn: FacebookConnection) => conn.platform === 'FACEBOOK' && conn.isActive
          )

          if (facebookConnections.length > 0) {
            setHasConnection(true)
            // Use provided connectionId or default to first active connection
            const connection = connectionId
              ? facebookConnections.find((c: FacebookConnection) => c.id === connectionId)
              : facebookConnections[0]

            if (connection) {
              setActiveConnectionId(connection.id)
              setPageName(connection.facebookPageName)
            }
          }
        }
      } catch (err) {
        console.error('Error checking Facebook connection:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [connectionId])

  const handlePublish = async () => {
    if (!activeConnectionId) {
      setError('No Facebook connection found')
      return
    }

    setIsPublishing(true)
    setError(null)
    setSuccessUrl(null)

    try {
      const response = await fetch('/api/social/facebook/publish', {
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
        throw new Error(data.error || 'Failed to publish to Facebook')
      }

      // Success!
      if (data.postUrl) {
        setSuccessUrl(data.postUrl)
      }

      if (onSuccess && data.postUrl) {
        onSuccess(data.postUrl)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to publish to Facebook'
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
          Connect your Facebook Page to share this quiz
        </p>
        <Button variant="outline" size={size} disabled>
          <svg
            className="mr-2 h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Share to Facebook
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
              Published to Facebook!
            </p>
            <a
              href={successUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              View on Facebook →
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
        className="bg-[#1877F2] hover:bg-[#166FE5] text-white border-0"
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
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Share to Facebook
            {pageName && (
              <span className="ml-1 text-xs opacity-75">({pageName})</span>
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
