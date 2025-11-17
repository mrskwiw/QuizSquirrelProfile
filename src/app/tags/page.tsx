'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'

interface TagStat {
  tag: string
  count: number
}

export default function TagsPage() {
  const router = useRouter()
  const [tags, setTags] = useState<TagStat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')

      const data = await response.json()
      setTags(data.tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate font size based on tag frequency
  const getTagSize = (count: number, maxCount: number) => {
    const minSize = 14
    const maxSize = 48
    const ratio = count / maxCount
    return Math.floor(minSize + ratio * (maxSize - minSize))
  }

  const maxCount = Math.max(...tags.map((t) => t.count), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Browse Tags" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Popular Tags
          </h2>
          <p className="text-gray-600">
            Discover quizzes by their tags
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading tags...</div>
          </div>
        ) : tags.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🏷️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tags yet
              </h3>
              <p className="text-gray-500">
                Tags will appear here once quizzes are created with tags
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tag Cloud */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Tag Cloud</h3>
                <div className="flex flex-wrap gap-4 justify-center items-center">
                  {tags.map((tag) => {
                    const fontSize = getTagSize(tag.count, maxCount)
                    return (
                      <button
                        key={tag.tag}
                        onClick={() => router.push(`/search?tags=${encodeURIComponent(tag.tag)}`)}
                        className="hover:text-blue-600 transition-colors font-semibold"
                        style={{ fontSize: `${fontSize}px` }}
                        title={`${tag.count} quizzes`}
                      >
                        #{tag.tag}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags List */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Tags</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.slice(0, 30).map((tag) => (
                  <Card
                    key={tag.tag}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/search?tags=${encodeURIComponent(tag.tag)}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏷️</span>
                          <div>
                            <h4 className="font-bold text-gray-900">#{tag.tag}</h4>
                            <p className="text-sm text-gray-600">
                              {tag.count} {tag.count === 1 ? 'quiz' : 'quizzes'}
                            </p>
                          </div>
                        </div>
                        <div className="text-gray-400">→</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
