'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  autoFocus?: boolean
  initialValue?: string
}

export function SearchBar({
  placeholder = 'Search quizzes, users, tags...',
  size = 'md',
  autoFocus = false,
  initialValue = '',
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-4 py-3',
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`flex-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${sizeClasses[size]}`}
      />
      <button
        type="submit"
        className={`bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${sizeClasses[size]} px-6`}
      >
        🔍
      </button>
    </form>
  )
}
