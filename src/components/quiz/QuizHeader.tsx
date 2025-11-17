'use client'

import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LikeButton } from './LikeButton'

interface QuizHeaderProps {
  quiz: {
    id: string
    title: string
    description: string | null
    category: string
    tags: string[]
    creator: {
      id: string
      username: string
      displayName: string
      avatarUrl: string | null
      isVerified: boolean
    }
    _count: {
      responses: number
      likes: number
      comments: number
    }
  }
}

export function QuizHeader({ quiz }: QuizHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-600 text-lg mb-4">{quiz.description}</p>
          )}
        </div>
        <Badge variant="default">{quiz.category}</Badge>
      </div>

      {/* Tags */}
      {quiz.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {quiz.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Creator Info & Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <a
          href={`/profile/${quiz.creator.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar
            src={quiz.creator.avatarUrl}
            alt={quiz.creator.displayName}
            fallback={quiz.creator.displayName}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{quiz.creator.displayName}</span>
              {quiz.creator.isVerified && (
                <Badge variant="success" className="text-xs">
                  ✓ Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">@{quiz.creator.username}</p>
          </div>
        </a>

        {/* Stats & Like Button */}
        <div className="flex items-center gap-4">
          <div className="flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-semibold">{quiz._count.responses.toLocaleString()}</span>
              <span className="ml-1">plays</span>
            </div>
            <div>
              <span className="font-semibold">{quiz._count.comments.toLocaleString()}</span>
              <span className="ml-1">comments</span>
            </div>
          </div>

          <LikeButton
            quizId={quiz.id}
            initialLikeCount={quiz._count.likes}
          />
        </div>
      </div>
    </div>
  )
}
