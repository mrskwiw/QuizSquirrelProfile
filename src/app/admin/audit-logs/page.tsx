'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AuditLog {
  id: string
  action: string
  targetType: string
  targetId: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
  admin: {
    id: string
    username: string
    displayName: string
  }
}

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, filterAction])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (filterAction) params.set('action', filterAction)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      alert('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('BLOCKED') || action.includes('DELETE')) return 'text-red-600'
    if (action.includes('UNBLOCKED') || action.includes('CREATED')) return 'text-green-600'
    if (action.includes('CHANGED') || action.includes('UPDATED')) return 'text-blue-600'
    return 'text-gray-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Actions</option>
                <option value="USER_TIER_CHANGED">User Tier Changed</option>
                <option value="USER_BLOCKED">User Blocked</option>
                <option value="USER_UNBLOCKED">User Unblocked</option>
                <option value="EMAIL_BLOCKED">Email Blocked</option>
                <option value="EMAIL_UNBLOCKED">Email Unblocked</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setFilterAction('')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-semibold ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {log.targetType}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      {log.oldValue && (
                        <div>
                          <span className="text-gray-500">From:</span> {log.oldValue}
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <span className="text-gray-500">To:</span> {log.newValue}
                        </div>
                      )}
                      {log.reason && (
                        <div>
                          <span className="text-gray-500">Reason:</span> {log.reason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>By {log.admin.displayName} (@{log.admin.username})</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      {log.targetId && (
                        <span className="font-mono">ID: {log.targetId.slice(0, 8)}...</span>
                      )}
                    </div>
                  </div>
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
