'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface FollowButtonProps {
  username: string
  initialIsFollowing: boolean
  initialFollowerCount: number
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void
}

export function FollowButton({
  username,
  initialIsFollowing,
  initialFollowerCount,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFollow = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          alert('Please log in to follow users')
          return
        }
        throw new Error(data.error || 'Failed to toggle follow')
      }

      const data = await response.json()
      setIsFollowing(data.isFollowing)
      setFollowerCount(data.followerCount)

      // Notify parent component
      if (onFollowChange) {
        onFollowChange(data.isFollowing, data.followerCount)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'primary'}
      onClick={handleToggleFollow}
      isLoading={isLoading}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
