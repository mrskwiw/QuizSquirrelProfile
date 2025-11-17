'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface BlockButtonProps {
  userId: string
  username: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onBlockChange?: (blocked: boolean) => void
}

export function BlockButton({
  userId,
  username,
  variant = 'outline',
  size = 'md',
  onBlockChange,
}: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkBlockStatus()
  }, [userId])

  const checkBlockStatus = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/block`)
      if (response.ok) {
        const data = await response.json()
        setIsBlocked(data.blocked)
      }
    } catch (error) {
      console.error('Failed to check block status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleBlock = async () => {
    if (isBlocked) {
      // Unblock
      if (!confirm(`Unblock @${username}? They will be able to see your content and message you again.`)) {
        return
      }
    } else {
      // Block
      if (
        !confirm(
          `Block @${username}?\n\n` +
            `• They won't be able to message you\n` +
            `• You won't see their content\n` +
            `• Any follow relationships will be removed`
        )
      ) {
        return
      }
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: isBlocked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update block status')
      }

      const data = await response.json()
      setIsBlocked(data.blocked)
      onBlockChange?.(data.blocked)

      // Show success message
      const message = data.blocked
        ? `Blocked @${username}`
        : `Unblocked @${username}`
      alert(message)
    } catch (error) {
      console.error('Error updating block status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update block status')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return null // Or a skeleton loader
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBlock}
      isLoading={isLoading}
      className={isBlocked ? 'text-red-600 hover:bg-red-50' : ''}
    >
      {isBlocked ? '🚫 Unblock' : '🚫 Block User'}
    </Button>
  )
}
