import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getConversation } from '@/lib/conversations'
import { MessageThread } from '@/components/messages/MessageThread'

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const conversation = await getConversation(id, user.id)

  if (!conversation) {
    redirect('/messages')
  }

  // Find the other user in the conversation
  const otherParticipant = conversation.ConversationParticipant.find((p: any) => p.userId !== user.id)

  if (!otherParticipant) {
    redirect('/messages')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white shadow-sm rounded-lg overflow-hidden"
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          <MessageThread
            conversationId={conversation.id}
            currentUserId={user.id}
            otherUser={otherParticipant.User}
          />
        </div>
      </div>
    </div>
  )
}
