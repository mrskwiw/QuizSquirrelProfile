'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * FacebookConnect Component
 * Initiates OAuth 2.0 flow to connect a Facebook Page
 */
export interface FacebookConnectProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function FacebookConnect({
  variant = 'primary',
  size = 'md',
  className,
  onSuccess,
  onError,
}: FacebookConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/social/facebook/auth/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Facebook connection')
      }

      // Store state in sessionStorage for verification on callback
      if (data.state) {
        sessionStorage.setItem('facebook_oauth_state', data.state)
      }

      // Redirect to Facebook authorization page
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No authorization URL received from server')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to Facebook'
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
        disabled={isConnecting}
        className="bg-[#1877F2] hover:bg-[#166FE5] text-white border-0"
      >
        {isConnecting ? (
          <>
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
            Connecting...
          </>
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
            Connect Facebook Page
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
