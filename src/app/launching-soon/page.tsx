'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LaunchingSoonPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || email.trim().length === 0) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/early-adopter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setEmail('')
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - No Header */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-6xl lg:text-8xl inline-block animate-bounce">🐿️</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              Quiz Squirrel
            </h1>
            <div className="mb-8">
              <span className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-xl lg:text-2xl font-semibold">
                🚀 Launching Soon
              </span>
            </div>
            <p className="text-xl lg:text-3xl mb-6 text-white font-semibold max-w-3xl mx-auto">
              Create, Share, and Discover Amazing Quizzes
            </p>
            <p className="text-lg lg:text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
              We're putting the finishing touches on something amazing. Join the community of quiz creators and takers. Build engaging quizzes, connect with friends, and challenge yourself with thousands of quizzes.
            </p>

            {/* Email Signup Form */}
            <Card className="max-w-2xl mx-auto p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  Get 3 Months Free Pro! 🎉
                </h2>
                <p className="text-gray-700 text-lg">
                  Be among the first to know when we launch and receive <strong>3 months of Pro membership absolutely free</strong> as an early adopter!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="text-lg h-14"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg text-lg px-8 h-14 whitespace-nowrap"
                  >
                    {isSubmitting ? 'Submitting...' : 'Notify Me'}
                  </Button>
                </div>

                {message && (
                  <div className="bg-green-50 border-2 border-green-200 text-green-800 p-4 rounded-lg">
                    <p className="font-semibold flex items-center gap-2">
                      <span>✓</span>
                      {message}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-lg">
                    <p className="font-semibold flex items-center gap-2">
                      <span>⚠</span>
                      {error}
                    </p>
                  </div>
                )}
              </form>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> No spam
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> No credit card
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> 3 months free Pro
                </span>
              </div>
            </Card>

            <p className="mt-8 text-indigo-200 text-lg">
              Join the waitlist and be the first to experience Quiz Squirrel
            </p>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What's Coming
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features that make quiz creation fun and engaging
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Easy Quiz Builder</h3>
              <p className="text-gray-600">
                Create stunning quizzes in minutes with our intuitive 4-step wizard. No coding required.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">4 Quiz Types</h3>
              <p className="text-gray-600">
                Multiple choice, personality tests, polls, and ratings. Perfect for every occasion.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Social Features</h3>
              <p className="text-gray-600">
                Follow friends, comment on quizzes, and see what your network is creating.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Real-Time Notifications</h3>
              <p className="text-gray-600">
                Get instant updates when someone takes your quiz, comments, or follows you.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Analytics</h3>
              <p className="text-gray-600">
                Track views, completions, and engagement metrics for all your quizzes.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-8 hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Beautiful Design</h3>
              <p className="text-gray-600">
                Gorgeous, responsive interface that works perfectly on any device.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Quiz Squirrel?</h2>
            <p className="text-xl text-indigo-100">Everything you need, nothing you don't</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">∞</div>
              <div className="text-xl text-indigo-100">Unlimited Quizzes</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4</div>
              <div className="text-xl text-indigo-100">Quiz Types</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-xl text-indigo-100">Free Forever</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">⚡</div>
              <div className="text-xl text-indigo-100">Real-Time Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Don't Miss Out on 3 Months Free Pro!
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Sign up now to be notified when we launch and claim your exclusive early adopter offer.
          </p>
          <Card className="max-w-xl mx-auto p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="text-lg h-14"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg text-lg h-14"
              >
                {isSubmitting ? 'Submitting...' : 'Get Early Access + 3 Months Free Pro'}
              </Button>

              {message && (
                <div className="bg-green-50 border-2 border-green-200 text-green-800 p-4 rounded-lg">
                  <p className="font-semibold flex items-center justify-center gap-2">
                    <span>✓</span>
                    {message}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-lg">
                  <p className="font-semibold flex items-center justify-center gap-2">
                    <span>⚠</span>
                    {error}
                  </p>
                </div>
              )}
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-white text-lg font-bold mb-4">Quiz Squirrel</h3>
            <p className="text-sm mb-4">
              Create, share, and discover amazing quizzes. Built for creators, educators, and quiz lovers.
            </p>
            <div className="border-t border-gray-800 mt-8 pt-8 text-sm">
              <p>&copy; 2025 Quiz Squirrel. All rights reserved.</p>
              <p className="mt-2">Built with Next.js, React, TypeScript, and ❤️</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
