import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { InvitationList } from '@/components/community/InvitationList'

export const metadata = {
  title: 'My Invitations - Quiz Squirrel',
  description: 'View and manage your community invitations'
}

/**
 * User invitations page
 * Displays all invitations received by the current user
 */
export default async function InvitationsPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Community Invitations
          </h1>
          <p className="text-gray-600">
            View and respond to invitations to join communities
          </p>
        </div>

        {/* Invitations List */}
        <InvitationList variant="user" />
      </div>
    </div>
  )
}
