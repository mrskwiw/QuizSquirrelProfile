'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PublishDialog } from './PublishDialog'
import { SocialMetrics } from './SocialMetrics'

export interface SocialShareSectionProps {
  quizId: string
  quizTitle: string
  showMetrics?: boolean
  className?: string
}

/**
 * SocialShareSection Component
 * Combines share button and social metrics display
 */
export function SocialShareSection({
  quizId,
  quizTitle,
  showMetrics = true,
  className,
}: SocialShareSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const handleSuccess = (result: { postId: string; postUrl?: string }) => {
    setShowSuccessMessage(true)
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000)
  }

  return (
    <div className={className}>
      {/* Share Button */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Share this quiz
        </h3>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsDialogOpen(true)}
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share to Social Media
        </Button>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Quiz shared successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Social Metrics */}
      {showMetrics && <SocialMetrics quizId={quizId} />}

      {/* Publish Dialog */}
      <PublishDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        quizId={quizId}
        quizTitle={quizTitle}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
