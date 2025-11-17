'use client'

import type { QuizSettings } from './QuizBuilder'

interface QuizSettingsFormProps {
  settings: QuizSettings
  onChange: (settings: QuizSettings) => void
}

export function QuizSettingsForm({ settings, onChange }: QuizSettingsFormProps) {
  const toggleSetting = (key: keyof QuizSettings) => {
    onChange({ ...settings, [key]: !settings[key] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Quiz Settings</h2>
        <p className="text-gray-600">
          Configure how your quiz works
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <div>
            <p className="font-medium">Randomize Questions</p>
            <p className="text-sm text-gray-500">Show questions in random order</p>
          </div>
          <input
            type="checkbox"
            checked={settings.randomizeQuestions}
            onChange={() => toggleSetting('randomizeQuestions')}
            className="w-5 h-5 text-blue-600"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <div>
            <p className="font-medium">Randomize Answers</p>
            <p className="text-sm text-gray-500">Show answer options in random order</p>
          </div>
          <input
            type="checkbox"
            checked={settings.randomizeAnswers}
            onChange={() => toggleSetting('randomizeAnswers')}
            className="w-5 h-5 text-blue-600"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <div>
            <p className="font-medium">Allow Retakes</p>
            <p className="text-sm text-gray-500">Let users take the quiz multiple times</p>
          </div>
          <input
            type="checkbox"
            checked={settings.allowRetakes}
            onChange={() => toggleSetting('allowRetakes')}
            className="w-5 h-5 text-blue-600"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <div>
            <p className="font-medium">Show Correct Answers</p>
            <p className="text-sm text-gray-500">Display correct answers after completion</p>
          </div>
          <input
            type="checkbox"
            checked={settings.showCorrectAnswers}
            onChange={() => toggleSetting('showCorrectAnswers')}
            className="w-5 h-5 text-blue-600"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <div>
            <p className="font-medium">Require Login</p>
            <p className="text-sm text-gray-500">Only logged-in users can take this quiz</p>
          </div>
          <input
            type="checkbox"
            checked={settings.requireLogin}
            onChange={() => toggleSetting('requireLogin')}
            className="w-5 h-5 text-blue-600"
          />
        </label>

        <div className="p-4 border rounded-lg">
          <label className="block">
            <p className="font-medium mb-2">Time Limit (optional)</p>
            <input
              type="number"
              value={settings.timeLimit || ''}
              onChange={(e) => onChange({
                ...settings,
                timeLimit: e.target.value ? parseInt(e.target.value) : undefined
              })}
              placeholder="Minutes"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty for no time limit</p>
          </label>
        </div>
      </div>
    </div>
  )
}
