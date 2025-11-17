'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface Stats {
  users: {
    total: number
    newToday: number
    byTier: Record<string, number>
    blocked: number
  }
  quizzes: {
    total: number
    published: number
    draft: number
  }
  responses: {
    total: number
  }
  blocked: {
    users: number
    emails: number
  }
  revenue: {
    thisMonth: number
    proSubscribers: number
    premiumSubscribers: number
  }
  recentActions: Array<{
    id: string
    action: string
    targetType: string
    createdAt: string
    admin: {
      username: string
      displayName: string
    }
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      alert('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Failed to load dashboard</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats.users.newToday} today
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </CardContent>
        </Card>

        {/* Published Quizzes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published Quizzes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.quizzes.published}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.quizzes.draft} drafts
                </p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Responses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.responses.total}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue (Month)</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.revenue.thisMonth.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.revenue.proSubscribers} PRO, {stats.revenue.premiumSubscribers} Premium
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Tiers */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Users by Tier</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">FREE</span>
                <span className="font-semibold">{stats.users.byTier.FREE || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">PRO</span>
                <span className="font-semibold text-blue-600">{stats.users.byTier.PRO || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">PREMIUM</span>
                <span className="font-semibold text-purple-600">{stats.users.byTier.PREMIUM || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Stats */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Moderation</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Blocked Users</span>
                <span className="font-semibold text-red-600">{stats.blocked.users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Blocked Emails</span>
                <span className="font-semibold text-red-600">{stats.blocked.emails}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Admin Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Admin Actions</h2>
          {stats.recentActions.length === 0 ? (
            <p className="text-gray-500">No recent actions</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {action.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {action.admin.displayName} • {action.targetType}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(action.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
