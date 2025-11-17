'use client'

import dynamic from 'next/dynamic'

// Dynamic import for heavy MessageInbox component
const MessageInbox = dynamic(() => import('@/components/messages/MessageInbox').then(mod => ({ default: mod.MessageInbox })), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-4">💬</div>
        <p className="text-gray-600">Loading messages...</p>
      </div>
    </div>
  ),
  ssr: false
})

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
          <MessageInbox />
        </div>
      </div>
    </div>
  )
}
