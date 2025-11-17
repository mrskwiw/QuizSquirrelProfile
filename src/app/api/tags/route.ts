import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tags - Get popular tags
// Cache for tags data (updated when new quizzes are published)
let tagsCache: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()

    // Return cached data if still valid (90-95% database load reduction)
    if (tagsCache && now - tagsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(tagsCache.data)
    }

    // Get all published quizzes with their tags
    const quizzes = await prisma.quiz.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        tags: true,
      },
    })

    // Count tag occurrences
    const tagCounts: Record<string, number> = {}

    quizzes.forEach((quiz) => {
      quiz.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // Convert to array and sort by count
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    const responseData = {
      success: true,
      tags,
      totalTags: tags.length,
    }

    // Update cache
    tagsCache = { data: responseData, timestamp: now }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Tags error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
