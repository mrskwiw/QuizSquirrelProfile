'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  role: string
  subscriptionTier: string
  isBlocked: boolean
  blockedReason: string | null
  createdAt: string
  _count: {
    quizzes: number
    responses: number
    followers: number
    following: number
  }
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterBlocked, setFilterBlocked] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page, filterTier, filterBlocked])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (filterTier) params.set('tier', filterTier)
      if (filterBlocked) params.set('blocked', filterBlocked)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const changeTier = async (userId: string, tier: string) => {
    const reason = prompt(`Reason for changing tier to ${tier}:`)
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, reason }),
      })

      if (!response.ok) throw new Error('Failed to change tier')
      alert('Tier updated successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error changing tier:', error)
      alert('Failed to change tier')
    }
  }

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'unblock' : 'block'
    const reason = currentlyBlocked
      ? 'Unblocking user'
      : prompt('Reason for blocking:')

    if (!currentlyBlocked && !reason) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !currentlyBlocked, reason }),
      })

      if (!response.ok) throw new Error(`Failed to ${action} user`)
      alert(`User ${action}ed successfully`)
      fetchUsers()
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      alert(`Failed to ${action} user`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email, username, or display name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tier
              </label>
              <select
                value={filterTier}
                onChange={(e) => { setFilterTier(e.target.value); setPage(1) }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Tiers</option>
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterBlocked}
                onChange={(e) => { setFilterBlocked(e.target.value); setPage(1) }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Users</option>
                <option value="false">Active</option>
                <option value="true">Blocked</option>
              </select>
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">Loading users...</div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={user.avatarUrl || ''}
                      alt={user.displayName}
                      fallback={user.displayName}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{user.displayName}</h3>
                        <Badge variant="secondary">
                          {user.subscriptionTier}
                        </Badge>
                        {user.role !== 'USER' && (
                          <Badge variant="secondary">{user.role}</Badge>
                        )}
                        {user.isBlocked && (
                          <Badge variant="danger">BLOCKED</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.isBlocked && user.blockedReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {user.blockedReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-600">
                      {user._count.quizzes} quizzes • {user._count.responses} responses
                    </div>
                    <div className="text-sm text-gray-600">
                      {user._count.followers} followers • {user._count.following} following
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        changeTier(user.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Change Tier...</option>
                    {user.subscriptionTier !== 'FREE' && <option value="FREE">FREE</option>}
                    {user.subscriptionTier !== 'PRO' && <option value="PRO">PRO</option>}
                    {user.subscriptionTier !== 'PREMIUM' && <option value="PREMIUM">PREMIUM</option>}
                  </select>

                  {user.role === 'USER' && (
                    <Button
                      variant={user.isBlocked ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => toggleBlock(user.id, user.isBlocked)}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block User'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
