'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TumblrConnect } from './TumblrConnect'
import { FacebookConnect } from './FacebookConnect'
import { ConnectionCard, Connection } from './ConnectionCard'

export interface SocialConnectionsSectionProps {
  className?: string
  compact?: boolean
}

/**
 * SocialConnectionsSection Component
 * Displays and manages social media connections on the dashboard
 */
export function SocialConnectionsSection({
  className,
  compact = false,
}: SocialConnectionsSectionProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    setIsLoading(false)
    setError(null)

    try {
      const response = await fetch('/api/social/connections')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch connections')
      }

      setConnections(data.connections || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load connections')
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = (connectionId: string) => {
    // Remove from state
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
  }

  const handleConnectSuccess = () => {
    // Refresh connections after successful connection
    fetchConnections()
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Social Media</CardTitle>
            {connections.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Hide' : 'Show'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center text-sm text-red-600">{error}</div>
          ) : connections.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your social media accounts to share quizzes.
              </p>
              <div className="flex flex-col gap-2">
                <TumblrConnect
                  variant="primary"
                  size="sm"
                  onSuccess={handleConnectSuccess}
                />
                <FacebookConnect
                  variant="primary"
                  size="sm"
                  onSuccess={handleConnectSuccess}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Platform Status Overview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Tumblr</span>
                  {connections.some((c) => c.platform === 'TUMBLR' && c.isActive) ? (
                    <span className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <span className="text-gray-400">Not connected</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">Facebook</span>
                  {connections.some((c) => c.platform === 'FACEBOOK' && c.isActive) ? (
                    <span className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <span className="text-gray-400">Not connected</span>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      onDisconnect={handleDisconnect}
                      onRefresh={fetchConnections}
                    />
                  ))}
                  <div className="flex flex-col gap-2">
                    <TumblrConnect
                      variant="outline"
                      size="sm"
                      onSuccess={handleConnectSuccess}
                    />
                    <FacebookConnect
                      variant="outline"
                      size="sm"
                      onSuccess={handleConnectSuccess}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your social media accounts to easily share your quizzes with
              your followers.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <TumblrConnect
                variant="primary"
                onSuccess={handleConnectSuccess}
              />
              <FacebookConnect
                variant="primary"
                onSuccess={handleConnectSuccess}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onDisconnect={handleDisconnect}
                  onRefresh={fetchConnections}
                />
              ))}
            </div>

            {/* Add more accounts */}
            <div className="border-t pt-4">
              <p className="mb-3 text-sm text-gray-600">Add more accounts:</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <TumblrConnect
                  variant="outline"
                  onSuccess={handleConnectSuccess}
                />
                <FacebookConnect
                  variant="outline"
                  onSuccess={handleConnectSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
