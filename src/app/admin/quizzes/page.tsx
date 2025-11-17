'use client'

import { Card, CardContent } from '@/components/ui/Card'

export default function QuizzesManagement() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Quiz Management</h1>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Moderation</h2>
          <p className="text-gray-600 mb-4">
            This feature will allow you to view all quizzes, moderate content, and handle reported quizzes.
          </p>
          <p className="text-sm text-gray-500">
            Coming in Phase 2 of the admin system implementation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
