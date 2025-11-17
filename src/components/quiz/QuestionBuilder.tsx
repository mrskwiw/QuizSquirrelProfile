'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ImageUpload } from './ImageUpload'
import type { Question } from './QuizBuilder'

interface QuestionBuilderProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)

  const addQuestion = (type: Question['questionType']) => {
    const timestamp = Date.now()
    const newQuestion: Question = {
      id: `q-${timestamp}`,
      questionText: '',
      questionType: type,
      orderIndex: questions.length,
      options: [
        {
          id: `opt-${timestamp}-1`,
          optionText: '',
          orderIndex: 0,
        },
        {
          id: `opt-${timestamp}-2`,
          optionText: '',
          orderIndex: 1,
        },
      ],
    }
    onChange([...questions, newQuestion])
    setSelectedQuestion(questions.length)
  }

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    onChange(newQuestions.map((q, i) => ({ ...q, orderIndex: i })))
    setSelectedQuestion(null)
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    onChange(newQuestions)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    const newOption = {
      id: `opt-${Date.now()}`,
      optionText: '',
      orderIndex: question.options.length,
    }
    updateQuestion(questionIndex, {
      options: [...question.options, newOption],
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<Question['options'][0]>) => {
    const question = questions[questionIndex]
    const newOptions = [...question.options]
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates }
    updateQuestion(questionIndex, { options: newOptions })
  }

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    const newOptions = question.options.filter((_, i) => i !== optionIndex)
    updateQuestion(questionIndex, {
      options: newOptions.map((opt, i) => ({ ...opt, orderIndex: i })),
    })
  }

  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    const newOptions = [...question.options]
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      isCorrect: !newOptions[optionIndex].isCorrect,
    }
    updateQuestion(questionIndex, { options: newOptions })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Questions</h2>
        <p className="text-gray-600">
          Add questions to your quiz
        </p>
      </div>

      {/* Question List */}
      {questions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No questions yet. Add your first question below!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className={`p-4 cursor-pointer ${
                selectedQuestion === index ? 'ring-2 ring-blue-600' : ''
              }`}
              onClick={() => setSelectedQuestion(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Q{index + 1}</Badge>
                    <Badge variant="default">
                      {question.questionType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900">
                    {question.questionText || 'Untitled question'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {question.options.length} option{question.options.length !== 1 ? 's' : ''}
                    {question.options.length < 2 && (
                      <span className="text-red-500 ml-2">⚠ Need at least 2</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteQuestion(index)
                  }}
                >
                  Delete
                </Button>
              </div>

              {/* Question Editor (when selected) */}
              {selectedQuestion === index && (
                <div className="mt-4 pt-4 border-t space-y-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                    placeholder="Enter your question"
                    className="w-full text-lg font-medium border-0 border-b-2 border-gray-200 focus:border-blue-600 focus:outline-none pb-2"
                  />

                  <ImageUpload
                    currentImage={question.imageUrl}
                    onImageChange={(imageUrl) => updateQuestion(index, { imageUrl: imageUrl || undefined })}
                    label="Question Image (optional)"
                    maxSizeMB={2}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Answer Options</label>
                    {question.options.map((option, optIndex) => (
                      <div key={option.id} className="space-y-2 p-3 border border-gray-200 rounded-md">
                        <div className="flex gap-2 items-center">
                          {question.questionType === 'MULTIPLE_CHOICE' && (
                            <input
                              type="checkbox"
                              checked={option.isCorrect || false}
                              onChange={() => toggleCorrectAnswer(index, optIndex)}
                              className="w-4 h-4 text-blue-600"
                            />
                          )}
                          <input
                            type="text"
                            value={option.optionText}
                            onChange={(e) => updateOption(index, optIndex, { optionText: e.target.value })}
                            placeholder={`Option ${optIndex + 1}`}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOption(index, optIndex)}
                            disabled={question.options.length <= 2}
                            title={question.options.length <= 2 ? 'Minimum 2 options required' : 'Delete option'}
                          >
                            ✕
                          </Button>
                        </div>
                        <ImageUpload
                          currentImage={option.imageUrl}
                          onImageChange={(imageUrl) => updateOption(index, optIndex, { imageUrl: imageUrl || undefined })}
                          label={`Option ${optIndex + 1} Image (optional)`}
                          maxSizeMB={1}
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(index)}
                    >
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Question Buttons */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Add New Question</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            onClick={() => addQuestion('MULTIPLE_CHOICE')}
          >
            Multiple Choice
          </Button>
          <Button
            variant="outline"
            onClick={() => addQuestion('PERSONALITY')}
          >
            Personality
          </Button>
          <Button
            variant="outline"
            onClick={() => addQuestion('POLL')}
          >
            Poll
          </Button>
          <Button
            variant="outline"
            onClick={() => addQuestion('RATING')}
          >
            Rating
          </Button>
        </div>
      </div>

      {questions.length > 0 && (
        <Badge variant="secondary">
          {questions.length} question{questions.length !== 1 ? 's' : ''} added
        </Badge>
      )}
    </div>
  )
}
