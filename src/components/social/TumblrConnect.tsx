'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * TumblrConnect Component
 * Initiates the OAuth flow to connect a Tumblr blog
 */
export interface TumblrConnectProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TumblrConnect({
  onSuccess,
  onError,
  variant = 'primary',
  size = 'md',
  className,
}: TumblrConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Call the request-token endpoint
      const response = await fetch('/api/social/tumblr/auth/request-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Tumblr connection')
      }

      if (!data.success || !data.authorizationUrl) {
        throw new Error('Invalid response from server')
      }

      // Redirect to Tumblr authorization page
      window.location.href = data.authorizationUrl
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to Tumblr'
      setError(errorMessage)
      setIsConnecting(false)

      if (onError) {
        onError(errorMessage)
      }
    }
  }

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={handleConnect}
        isLoading={isConnecting}
        disabled={isConnecting}
      >
        {isConnecting ? (
          'Connecting...'
        ) : (
          <>
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Tumblr logo */}
              <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.178l.011.002z" />
            </svg>
            Connect Tumblr
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
