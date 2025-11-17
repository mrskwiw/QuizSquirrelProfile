'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BlockedEmail {
  id: string
  email: string
  reason: string | null
  blockedAt: string
  admin: {
    username: string
    displayName: string
  }
}

export default function BlockedEmailsManagement() {
  const [blockedEmails, setBlockedEmails] = useState<BlockedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newReason, setNewReason] = useState('')

  useEffect(() => {
    fetchBlockedEmails()
  }, [])

  const fetchBlockedEmails = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/blocked-emails')
      if (!response.ok) throw new Error('Failed to fetch blocked emails')
      const data = await response.json()
      setBlockedEmails(data.blockedEmails)
    } catch (error) {
      console.error('Error fetching blocked emails:', error)
      alert('Failed to load blocked emails')
    } finally {
      setLoading(false)
    }
  }

  const blockEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail.trim()) {
      alert('Please enter an email address')
      return
    }

    try {
      const response = await fetch('/api/admin/blocked-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), reason: newReason.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to block email')
      }

      alert('Email blocked successfully')
      setNewEmail('')
      setNewReason('')
      fetchBlockedEmails()
    } catch (error: any) {
      console.error('Error blocking email:', error)
      alert(error.message || 'Failed to block email')
    }
  }

  const unblockEmail = async (id: string) => {
    if (!confirm('Are you sure you want to unblock this email?')) return

    try {
      const response = await fetch(`/api/admin/blocked-emails?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to unblock email')
      alert('Email unblocked successfully')
      fetchBlockedEmails()
    } catch (error) {
      console.error('Error unblocking email:', error)
      alert('Failed to unblock email')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Blocked Emails</h1>

      {/* Block New Email Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Block New Email</h2>
          <form onSubmit={blockEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com or @domain.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter an email address or domain (e.g., @tempmail.com to block entire domain)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Why is this email being blocked?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
            <Button type="submit" variant="primary">
              Block Email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Blocked Emails List */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Blocked Emails ({blockedEmails.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading...</div>
          ) : blockedEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No blocked emails yet
            </div>
          ) : (
            <div className="space-y-3">
              {blockedEmails.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.email}</div>
                    {item.reason && (
                      <div className="text-sm text-gray-600 mt-1">
                        Reason: {item.reason}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Blocked by {item.admin.displayName} on{' '}
                      {new Date(item.blockedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockEmail(item.id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
