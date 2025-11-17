import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-6xl lg:text-8xl inline-block animate-bounce">🐿️</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              Quiz Squirrel
            </h1>
            <p className="text-xl lg:text-2xl mb-4 text-indigo-100 max-w-3xl mx-auto">
              Create, Share, and Discover Amazing Quizzes
            </p>
            <p className="text-lg text-indigo-200 mb-10 max-w-2xl mx-auto">
              Join the community of quiz creators and takers. Build engaging quizzes, connect with friends, and challenge yourself with thousands of quizzes.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button variant="primary" size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl text-lg px-8 py-4">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/feed">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 text-lg px-8 py-4">
                  Explore Quizzes
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-indigo-200">
              No credit card required • Free forever • Create unlimited quizzes
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Amazing Quizzes
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

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Sign Up Free</h3>
              <p className="text-gray-600 text-lg">
                Create your account in seconds. No credit card required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Create Your Quiz</h3>
              <p className="text-gray-600 text-lg">
                Use our easy builder to create engaging quizzes in minutes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Share & Engage</h3>
              <p className="text-gray-600 text-lg">
                Publish your quiz and watch as people take it and engage.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4 shadow-lg">
                Create Your First Quiz
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect For Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Whatever your need, Quiz Squirrel has you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Use Case 1 */}
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🎓</span>
                Educators
              </h3>
              <p className="text-gray-700 mb-4">
                Create engaging assessments, knowledge checks, and interactive learning materials for your students.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Track student progress</li>
                <li>• Instant feedback</li>
                <li>• Multiple question types</li>
              </ul>
            </Card>

            {/* Use Case 2 */}
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">💼</span>
                Businesses
              </h3>
              <p className="text-gray-700 mb-4">
                Engage your audience, gather feedback, and create interactive content for marketing campaigns.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Lead generation</li>
                <li>• Customer surveys</li>
                <li>• Product quizzes</li>
              </ul>
            </Card>

            {/* Use Case 3 */}
            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                Content Creators
              </h3>
              <p className="text-gray-700 mb-4">
                Build your audience with fun personality tests, trivia, and interactive content for social media.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Viral content</li>
                <li>• Audience engagement</li>
                <li>• Share on social media</li>
              </ul>
            </Card>

            {/* Use Case 4 */}
            <Card className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🎮</span>
                Just For Fun
              </h3>
              <p className="text-gray-700 mb-4">
                Create fun quizzes to share with friends, test knowledge, or just have a good time.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Trivia nights</li>
                <li>• Personality tests</li>
                <li>• Challenge friends</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Create Amazing Quizzes?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join Quiz Squirrel today and start creating engaging quizzes that your audience will love.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4 shadow-xl">
                Sign Up Free
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Browse Quizzes
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Quiz Squirrel</h3>
              <p className="text-sm">
                Create, share, and discover amazing quizzes. Built for creators, educators, and quiz lovers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/quiz/create" className="hover:text-white">Create Quiz</Link></li>
                <li><Link href="/feed" className="hover:text-white">Explore</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Quiz Squirrel. All rights reserved.</p>
            <p className="mt-2">Built with Next.js, React, TypeScript, and ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
