import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

// Force dynamic rendering for admin routes (uses cookies for auth)
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check - cannot be bypassed by disabling JavaScript
  const user = await getCurrentUser()

  // Redirect if not authenticated or not an admin
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Quiz Squirrel
              </Link>
              <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.displayName} ({user.role})
              </span>
              <Link
                href="/"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl">📊</span>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl">👥</span>
                  <span>Users</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/blocked-emails"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl">🚫</span>
                  <span>Blocked Emails</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/quizzes"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl">📝</span>
                  <span>Quizzes</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/messages"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl">💬</span>
                  <span>Messages</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl">📋</span>
                  <span>Audit Logs</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
