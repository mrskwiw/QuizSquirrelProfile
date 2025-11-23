'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface QuizInfoFormProps {
  data: {
    title: string
    description: string
    category: string
    tags: string[]
    coverImage?: string
    communityId?: string
  }
  onChange: (data: Partial<QuizInfoFormProps['data']>) => void
}

interface Community {
  id: string
  name: string
  isMember: boolean
}

const CATEGORIES = [
  'Entertainment',
  'Movies & TV',
  'Music',
  'Gaming',
  'Personality & Lifestyle',
  'Trivia & Knowledge',
  'History',
  'Science',
  'Geography',
  'Pop Culture',
  'Sports',
  'Food & Drink',
  'Animals & Nature',
  'Just for Fun',
]

export function QuizInfoForm({ data, onChange }: QuizInfoFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false)

  // Fetch user's communities on mount
  useEffect(() => {
    fetchUserCommunities()
  }, [])

  const fetchUserCommunities = async () => {
    setIsLoadingCommunities(true)
    try {
      const response = await fetch('/api/communities?limit=100')
      if (response.ok) {
        const result = await response.json()
        // Filter to only communities where user is a member
        const memberCommunities = result.communities.filter(
          (c: Community) => c.isMember
        )
        setCommunities(memberCommunities)
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error)
    } finally {
      setIsLoadingCommunities(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        onChange({ coverImage: base64String })
        setIsUploading(false)
      }
      reader.onerror = () => {
        setUploadError('Failed to read image')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadError('Failed to upload image')
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onChange({ coverImage: undefined })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Quiz Information</h2>
        <p className="text-gray-600">
          Tell us about your quiz
        </p>
      </div>

      <Input
        label="Quiz Title"
        value={data.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Enter an engaging title for your quiz"
        required
        helperText="Make it catchy and descriptive"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what your quiz is about..."
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional - Give quiz takers more context
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Community Selector */}
      {communities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post to Community (Optional)
          </label>
          <select
            value={data.communityId || ''}
            onChange={(e) => onChange({ communityId: e.target.value || undefined })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={isLoadingCommunities}
          >
            <option value="">None - Post to personal profile</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Share your quiz with a community you belong to
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <Input
          value={data.tags.join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            onChange({ tags })
          }}
          placeholder="e.g. fun, personality, viral"
          helperText="Separate tags with commas to help people find your quiz"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Image
        </label>

        {data.coverImage ? (
          // Show uploaded image
          <div className="relative">
            <img
              src={data.coverImage}
              alt="Quiz cover"
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-600"
            >
              ✕ Remove
            </Button>
          </div>
        ) : (
          // Upload area
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="cover-image-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="cover-image-upload"
              className="cursor-pointer block"
            >
              {isUploading ? (
                <div>
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-600 font-medium">Uploading...</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-gray-600 font-medium">
                    Click to upload cover image
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
            </label>
          </div>
        )}

        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}

        <p className="mt-2 text-sm text-gray-500">
          Optional - Add an eye-catching cover image to attract quiz takers
        </p>
      </div>
    </div>
  )
}
