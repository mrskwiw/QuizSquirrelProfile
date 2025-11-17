'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { QuizData } from './QuizBuilder'

interface QuizPreviewProps {
  quiz: QuizData
}

export function QuizPreview({ quiz }: QuizPreviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Preview</h2>
        <p className="text-gray-600">
          Review your quiz before publishing
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{quiz.title || 'Untitled Quiz'}</CardTitle>
              <p className="text-gray-500 mt-2">{quiz.description}</p>
            </div>
            <Badge>{quiz.category || 'Uncategorized'}</Badge>
          </div>
          {quiz.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {quiz.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Quiz Summary</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• {quiz.questions.length} questions</li>
                <li>• {quiz.settings.randomizeQuestions ? 'Randomized' : 'Fixed'} question order</li>
                <li>• {quiz.settings.allowRetakes ? 'Retakes allowed' : 'One attempt only'}</li>
                {quiz.settings.timeLimit && <li>• {quiz.settings.timeLimit} minute time limit</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold">Questions Preview</h3>
        {quiz.questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Badge variant="secondary">{index + 1}</Badge>
                <div className="flex-1">
                  <p className="font-medium mb-3">{question.questionText || 'Untitled question'}</p>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={option.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-500">
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <span className={option.isCorrect ? 'text-green-600 font-medium' : ''}>
                          {option.optionText}
                          {option.isCorrect && ' ✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quiz.questions.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No questions added yet</p>
        </Card>
      )}
    </div>
  )
}
