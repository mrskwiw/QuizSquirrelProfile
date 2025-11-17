import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Tumblr Vibes */}
      <section className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {/* Subtle pattern overlay for that Tumblr aesthetic */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
          }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-6xl lg:text-8xl inline-block">🐿️✨</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              Quiz Squirrel
            </h1>
            <p className="text-2xl lg:text-3xl mb-4 font-bold max-w-4xl mx-auto">
              Finally, a social platform that actually understands you
            </p>
            <p className="text-lg lg:text-xl text-purple-100 mb-10 max-w-3xl mx-auto">
              Share your personality quizzes to Tumblr and Facebook without dealing with sketchy sites, ads, or paywalls.
              Create the quizzes your mutuals deserve.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button variant="primary" size="lg" className="bg-white text-purple-600 hover:bg-purple-50 shadow-xl text-lg px-8 py-4 font-bold">
                  Start Creating (It's Free)
                </Button>
              </Link>
              <Link href="/feed">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4">
                  Explore Quizzes
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-purple-200">
              No ads • No paywalls • Actually respects your privacy
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section - Why Tumblr Users Will Love This */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why your mutuals will thank you
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We built this because we were tired of clicking quiz links and getting bombarded with ads,
              trackers, and paywalls. Here's what makes us different:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 - No Sketchy Stuff */}
            <Card className="p-8 bg-white border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Actually Safe to Click</h3>
              <p className="text-gray-700 leading-relaxed">
                No malware. No sketchy trackers. No selling your data. Just quizzes.
                Your mutuals can click without worrying.
              </p>
            </Card>

            {/* Benefit 2 - Express Yourself */}
            <Card className="p-8 bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">💜</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Express Your Whole Self</h3>
              <p className="text-gray-700 leading-relaxed">
                Create personality quizzes that actually capture the nuance of your interests,
                fandoms, and aesthetics. Make "Which Hozier song are you?" but make it deep.
              </p>
            </Card>

            {/* Benefit 3 - No Paywalls */}
            <Card className="p-8 bg-white border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Free Forever, For Real</h3>
              <p className="text-gray-700 leading-relaxed">
                Create unlimited quizzes. Share unlimited results. No "upgrade to see your answer" nonsense.
                We mean it when we say free.
              </p>
            </Card>

            {/* Benefit 4 - Easy Sharing */}
            <Card className="p-8 bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Share to Tumblr & Facebook</h3>
              <p className="text-gray-700 leading-relaxed">
                One click to share your quizzes to Tumblr and Facebook. Clean links that look good in posts.
                Beautiful result cards perfect for screenshots.
              </p>
            </Card>

            {/* Benefit 5 - Community Vibes */}
            <Card className="p-8 bg-white border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Find Your People</h3>
              <p className="text-gray-700 leading-relaxed">
                Follow quiz creators who share your interests. Build a feed of quizzes that actually
                match your vibe. It's like curating your dash, but for quizzes.
              </p>
            </Card>

            {/* Benefit 6 - Your Creative Control */}
            <Card className="p-8 bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Total Creative Freedom</h3>
              <p className="text-gray-700 leading-relaxed">
                Make the quiz exactly how you want it. Personality types, trivia, polls, rating scales —
                no templates forcing you into a box.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Perfect For Section - Tumblr Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              The quizzes your dash needs
            </h2>
            <p className="text-xl text-gray-600">
              Here's what people are already creating
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Use Case 1 - Fandom Quizzes */}
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                Fandom Deep Cuts
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "Which minor character from your favorite show are you actually?"
                "What's your role in the found family?"
                Make the hyper-specific fandom quizzes that only your mutuals will understand.
              </p>
            </Card>

            {/* Use Case 2 - Personality & Aesthetics */}
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🌙</span>
                Vibe Checks
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "What's your core aesthetic?" "Which era of the internet are you?"
                "What type of cozy beverage matches your energy?"
                The personality quizzes that define a generation.
              </p>
            </Card>

            {/* Use Case 3 - Music & Media */}
            <Card className="p-8 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🎵</span>
                Music & Media Taste
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "Build your perfect playlist and we'll tell you your trauma response."
                "Which Mitski lyric is your entire personality?"
                For when music taste is a personality trait (affectionate).
              </p>
            </Card>

            {/* Use Case 4 - Just For Fun */}
            <Card className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100">
              <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-3">
                <span className="text-3xl">🎪</span>
                Chaotic Good Energy
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "What kind of cryptid would you be?" "What's your oddly specific superpower?"
                "Rate these soups and we'll assign you a life philosophy."
                Embrace the chaos.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Built by someone who actually uses Tumblr
          </h2>
          <p className="text-xl lg:text-2xl text-purple-100 mb-8 leading-relaxed">
            We're tired of clicking quiz links that lead to ad-infested nightmares.
            We wanted a place where the quiz IS the point, not the vehicle for selling you stuff.
            So we built it.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="text-5xl font-bold mb-2">0</div>
              <div className="text-xl text-purple-100">Ads (ever)</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">∞</div>
              <div className="text-xl text-purple-100">Quizzes you can make</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-xl text-purple-100">Made for your vibe</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple & Clear */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Absurdly easy to use
            </h2>
            <p className="text-xl text-gray-600">
              Seriously, if you can write a Tumblr post, you can make a quiz
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Write your questions</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Type out your questions and answers. Add images if you want.
                It's literally that simple.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Make it yours</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Pick your quiz type (personality test, poll, trivia, whatever).
                Write result descriptions that actually slap.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Share the link</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Post it on Tumblr. Watch people actually enjoy taking it
                without getting bombarded by ads.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/register">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4 shadow-lg">
                Make Your First Quiz
              </Button>
            </Link>
            <p className="mt-4 text-gray-500">
              Takes like 5 minutes, we promise
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Your mutuals deserve better quiz links
          </h2>
          <p className="text-xl text-gray-700 mb-10 leading-relaxed">
            Stop sending people to websites that look like they gave your computer a virus.
            Create quizzes on a platform that actually respects you and your audience.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button variant="primary" size="lg" className="text-lg px-8 py-4 shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Creating Free
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                See Example Quizzes
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Log in here
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <span className="text-4xl">🐿️</span>
            </div>
            <h3 className="text-white text-lg font-bold mb-4">Quiz Squirrel</h3>
            <p className="text-sm mb-6 max-w-2xl mx-auto">
              The quiz platform that doesn't suck. Made with love for Tumblr users,
              by Tumblr users who were tired of sketchy quiz sites.
            </p>
            <div className="flex justify-center gap-8 text-sm mb-8">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <div className="border-t border-gray-800 pt-8 text-sm">
              <p>&copy; 2025 Quiz Squirrel. All rights reserved.</p>
              <p className="mt-2 text-gray-500">
                No venture capital. No selling your data. Just vibes and quizzes.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
