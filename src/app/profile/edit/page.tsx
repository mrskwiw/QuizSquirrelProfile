'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ProfileData {
  displayName: string
  bio: string
  location: string
  website: string
  pronouns: string
  interests: string[]
  twitterHandle: string
  tumblrHandle: string
  instagramHandle: string
  tiktokHandle: string
  facebookHandle: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [interestInput, setInterestInput] = useState('')

  const [formData, setFormData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    pronouns: '',
    interests: [],
    twitterHandle: '',
    tumblrHandle: '',
    instagramHandle: '',
    tiktokHandle: '',
    facebookHandle: '',
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        setIsAuthenticated(true)
        fetchProfile()
      } else {
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    } catch {
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')

      const data = await response.json()
      setFormData({
        displayName: data.displayName || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        pronouns: data.pronouns || '',
        interests: data.interests || [],
        twitterHandle: data.twitterHandle || '',
        tumblrHandle: data.tumblrHandle || '',
        instagramHandle: data.instagramHandle || '',
        tiktokHandle: data.tiktokHandle || '',
        facebookHandle: data.facebookHandle || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      alert('Failed to load profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      const data = await response.json()
      alert('Profile updated successfully!')
      router.push(`/profile/${data.username}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const addInterest = () => {
    if (interestInput.trim() && formData.interests.length < 10) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput.trim()],
      })
      setInterestInput('')
    }
  }

  const removeInterest = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index),
    })
  }

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Edit Profile" />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                Login Required
              </h3>
              <p className="text-gray-500 mb-6">
                Please log in to edit your profile.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/register')}
                >
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Edit Profile" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                placeholder="Your name"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />

              <Input
                label="Website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />

              <Input
                label="Pronouns"
                value={formData.pronouns}
                onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                placeholder="e.g., he/him, she/her, they/them"
              />
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    placeholder="Add an interest..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={30}
                  />
                  <Button
                    type="button"
                    onClick={addInterest}
                    disabled={!interestInput.trim() || formData.interests.length >= 10}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.interests.length}/10 interests
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(index)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {formData.interests.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No interests added yet. Add some to help others find you!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Social Media Handles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Twitter/X Handle"
                value={formData.twitterHandle}
                onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value.replace('@', '') })}
                placeholder="username (without @)"
                helperText="Your Twitter/X username"
              />

              <Input
                label="Tumblr Handle"
                value={formData.tumblrHandle}
                onChange={(e) => setFormData({ ...formData, tumblrHandle: e.target.value })}
                placeholder="username"
                helperText="Your Tumblr username"
              />

              <Input
                label="Instagram Handle"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value.replace('@', '') })}
                placeholder="username (without @)"
                helperText="Your Instagram username"
              />

              <Input
                label="TikTok Handle"
                value={formData.tiktokHandle}
                onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value.replace('@', '') })}
                placeholder="username (without @)"
                helperText="Your TikTok username"
              />

              <Input
                label="Facebook Profile"
                value={formData.facebookHandle}
                onChange={(e) => setFormData({ ...formData, facebookHandle: e.target.value })}
                placeholder="username or profile name"
                helperText="Your Facebook username or profile name"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
