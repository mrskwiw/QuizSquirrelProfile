'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const quizId = searchParams.get('quizId')
  const message = searchParams.get('message')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      setIsAuthenticated(response.ok)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (tier: 'PRO' | 'PREMIUM') => {
    // TODO: Implement actual payment flow with Stripe
    alert(`Upgrade to ${tier} - Payment integration coming soon!`)

    // For now, simulate successful upgrade and redirect to publish
    if (quizId) {
      // After successful upgrade, publish the quiz
      try {
        const response = await fetch(`/api/quiz/${quizId}/publish`, {
          method: 'POST',
        })

        const data = await response.json()

        if (response.ok) {
          alert('Quiz published successfully!')
          router.push(`/quiz/${quizId}`)
        } else {
          alert(data.error || 'Failed to publish quiz')
        }
      } catch (error) {
        console.error('Error publishing quiz:', error)
        alert('Failed to publish quiz. Please try again.')
      }
    }
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
        <Header title="Upgrade" />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                Login Required
              </h3>
              <p className="text-gray-500 mb-6">
                Please log in to view and upgrade your subscription.
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade Your Account</h1>
          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg inline-block">
              {message}
            </div>
          )}
          <p className="text-xl text-gray-600 mt-4">
            Create unlimited quizzes and unlock premium features
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Free Tier */}
          <Card>
            <CardHeader>
              <div className="text-center">
                <CardTitle>Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>2 quizzes per day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Up to 20 questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>50 MB storage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="mr-2">✗</span>
                  <span>Includes ads</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="border-2 border-blue-600 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Badge variant="default" className="bg-blue-600">Most Popular</Badge>
            </div>
            <CardHeader>
              <div className="text-center">
                <CardTitle>Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="font-semibold">Unlimited quizzes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Up to 50 questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>500 MB storage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>No ads</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button
                variant="primary"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleUpgrade('PRO')}
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          {/* Premium Tier */}
          <Card>
            <CardHeader>
              <div className="text-center">
                <CardTitle>Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="font-semibold">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Unlimited questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>2 GB storage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Real-time analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="font-semibold">Create communities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Verified badge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Custom branding</span>
                </li>
              </ul>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handleUpgrade('PREMIUM')}
              >
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        {quizId && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/quiz/create`)}
            >
              Back to Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
