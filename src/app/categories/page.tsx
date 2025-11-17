'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'

// Quiz categories
const CATEGORIES = [
  { name: 'General Knowledge', icon: '🧠', color: 'bg-blue-500' },
  { name: 'Science', icon: '🔬', color: 'bg-green-500' },
  { name: 'History', icon: '📜', color: 'bg-yellow-500' },
  { name: 'Geography', icon: '🌍', color: 'bg-teal-500' },
  { name: 'Entertainment', icon: '🎬', color: 'bg-purple-500' },
  { name: 'Sports', icon: '⚽', color: 'bg-orange-500' },
  { name: 'Music', icon: '🎵', color: 'bg-pink-500' },
  { name: 'Literature', icon: '📚', color: 'bg-indigo-500' },
  { name: 'Art', icon: '🎨', color: 'bg-red-500' },
  { name: 'Technology', icon: '💻', color: 'bg-cyan-500' },
  { name: 'Food & Drink', icon: '🍕', color: 'bg-amber-500' },
  { name: 'Animals & Nature', icon: '🦁', color: 'bg-lime-500' },
  { name: 'Personality', icon: '✨', color: 'bg-violet-500' },
  { name: 'Fun & Games', icon: '🎮', color: 'bg-fuchsia-500' },
  { name: 'Other', icon: '📌', color: 'bg-gray-500' },
]

interface CategoryStats {
  category: string
  count: number
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategoryStats()
  }, [])

  const fetchCategoryStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')

      const data = await response.json()
      setCategoryStats(data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryCount = (categoryName: string) => {
    const stat = categoryStats.find((s) => s.category === categoryName)
    return stat?.count || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Browse Categories" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Quiz Categories
          </h2>
          <p className="text-gray-600">
            Browse thousands of quizzes organized by topic
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading categories...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((category) => {
              const count = getCategoryCount(category.name)
              return (
                <Card
                  key={category.name}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/search?category=${encodeURIComponent(category.name)}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {count} {count === 1 ? 'quiz' : 'quizzes'}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        →
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
