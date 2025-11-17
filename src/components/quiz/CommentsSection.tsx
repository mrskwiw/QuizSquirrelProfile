'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
  }
  _count: {
    likes: number
    replies: number
  }
  replies?: Comment[]
}

interface CommentsSectionProps {
  quizId: string
}

export function CommentsSection({ quizId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [quizId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          alert('Please log in to comment')
          return
        }
        throw new Error(data.error || 'Failed to post comment')
      }

      setNewComment('')
      fetchComments() // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quiz/${quizId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          parentId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          alert('Please log in to reply')
          return
        }
        throw new Error(data.error || 'Failed to post reply')
      }

      setReplyContent('')
      setReplyingTo(null)
      fetchComments() // Refresh comments
    } catch (error) {
      console.error('Error posting reply:', error)
      alert('Failed to post reply. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      fetchComments() // Refresh comments
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        <a href={`/profile/${comment.user.username}`} className="flex-shrink-0">
          <Avatar
            src={comment.user.avatarUrl}
            alt={comment.user.displayName}
            fallback={comment.user.displayName}
            size="sm"
          />
        </a>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={`/profile/${comment.user.username}`}
              className="font-semibold text-sm hover:underline"
            >
              {comment.user.displayName}
            </a>
            {comment.user.isVerified && (
              <Badge variant="success" className="text-xs px-1 py-0">
                ✓
              </Badge>
            )}
            <a
              href={`/profile/${comment.user.username}`}
              className="text-xs text-gray-500 hover:underline"
            >
              @{comment.user.username}
            </a>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-gray-900 text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Reply
              </button>
            )}
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Delete
            </button>
            {comment._count.replies > 0 && (
              <span className="text-xs text-gray-500">
                {comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  isLoading={isSubmitting}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Comments ({comments.length})
        </h2>

        {/* New Comment Form */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {newComment.length}/1000 characters
            </span>
            <Button
              onClick={handleSubmitComment}
              isLoading={isSubmitting}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
