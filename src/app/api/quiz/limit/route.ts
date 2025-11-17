import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getQuizzesRemainingToday } from '@/utils/featureGates'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const remaining = await getQuizzesRemainingToday(user.id)

    return NextResponse.json({
      remaining,
      tier: user.subscriptionTier,
      unlimited: user.subscriptionTier !== 'FREE',
    })

  } catch (error) {
    console.error('Quiz limit check error:', error)
    return NextResponse.json(
      { error: 'Failed to check quiz limit' },
      { status: 500 }
    )
  }
}
