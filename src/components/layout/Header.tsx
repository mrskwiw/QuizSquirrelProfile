'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '@/components/search/SearchBar'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { MessageIcon } from '@/components/messages/MessageIcon'
import { useState, useEffect } from 'react'

interface HeaderProps {
  showSearch?: boolean
  showNotifications?: boolean
  showCreateButton?: boolean
  title?: string
}

export function Header({
  showSearch = true,
  showNotifications = true,
  showCreateButton = true,
  title,
}: HeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      setIsAuthenticated(response.ok)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        // Use window.location for hard redirect to clear all cached state
        window.location.href = '/login'
      } else {
        console.error('Logout failed')
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top Row - Logo, Title, Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Quiz Squirrel
            </Link>
            {title && (
              <>
                <span className="text-gray-400 hidden sm:inline">|</span>
                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">{title}</h1>
              </>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {showNotifications && <NotificationCenter />}
            {isAuthenticated && <MessageIcon />}

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/new')}
            >
              🆕 New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/trending')}
            >
              🔥 Trending
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/categories')}
            >
              📂 Categories
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/tags')}
            >
              🏷️ Tags
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/feed')}
            >
              📰 Feed
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              📊 Dashboard
            </Button>

            {showCreateButton && isAuthenticated && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/quiz/create')}
              >
                + Create Quiz
              </Button>
            )}

            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? '...' : '🚪 Logout'}
              </Button>
            ) : isAuthenticated === false ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/login')}
              >
                🔑 Login
              </Button>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {showNotifications && <NotificationCenter />}
            {isAuthenticated && <MessageIcon />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t pt-4 pb-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/new')
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start text-gray-900 font-medium"
            >
              🆕 New
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/trending')
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start text-gray-900 font-medium"
            >
              🔥 Trending
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/categories')
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start text-gray-900 font-medium"
            >
              📂 Categories
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/tags')
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start text-gray-900 font-medium"
            >
              🏷️ Tags
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/feed')
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start text-gray-900 font-medium"
            >
              📰 Feed
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/dashboard')
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start text-gray-900 font-medium"
            >
              📊 Dashboard
            </Button>

            {showCreateButton && isAuthenticated && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  router.push('/quiz/create')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full justify-start font-medium"
              >
                + Create Quiz
              </Button>
            )}

            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                disabled={isLoggingOut}
                className="w-full justify-start text-gray-900 font-medium"
              >
                {isLoggingOut ? '...' : '🚪 Logout'}
              </Button>
            ) : isAuthenticated === false ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  router.push('/login')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full justify-start font-medium"
              >
                🔑 Login
              </Button>
            ) : null}
          </div>
        )}

        {/* Search Bar Row */}
        {showSearch && (
          <div className="max-w-2xl mt-4">
            <SearchBar size="md" />
          </div>
        )}
      </div>
    </div>
  )
}
