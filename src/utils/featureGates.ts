import { User } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const TIER_LIMITS = {
  FREE: {
    maxQuizzesPerDay: 2,
    maxQuestionsPerQuiz: 20,
    storageLimit: 50, // MB
    analytics: 'basic',
    canCreateCommunities: false,
    hasAds: true,
  },
  PRO: {
    maxQuizzesPerDay: Infinity,
    maxQuestionsPerQuiz: 50,
    storageLimit: 500, // MB
    analytics: 'advanced',
    canCreateCommunities: false,
    hasAds: false,
  },
  PREMIUM: {
    maxQuizzesPerDay: Infinity,
    maxQuestionsPerQuiz: Infinity,
    storageLimit: 2000, // MB
    analytics: 'realtime',
    canCreateCommunities: true, // Only Premium users can create communities
    hasAds: false,
  },
}

// Check if user can create quiz today
export async function canCreateQuiz(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return false

  const limits = TIER_LIMITS[user.subscriptionTier]

  // Pro and Premium have unlimited
  if (limits.maxQuizzesPerDay === Infinity) return true

  // Check if we need to reset daily counter
  const lastCreated = user.lastQuizCreatedAt
  const today = new Date()
  const isNewDay = !lastCreated ||
    new Date(lastCreated).toDateString() !== today.toDateString()

  // If new day, reset counter
  if (isNewDay) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        quizzesCreatedToday: 0,
        lastQuizCreatedAt: today,
      },
    })
    return true
  }

  // Check against daily limit
  return user.quizzesCreatedToday < limits.maxQuizzesPerDay
}

export function canAddQuestion(questionCount: number, user: User): boolean {
  const limits = TIER_LIMITS[user.subscriptionTier]
  return questionCount < limits.maxQuestionsPerQuiz
}

export function canUploadFile(fileSize: number, user: User): boolean {
  const limits = TIER_LIMITS[user.subscriptionTier]
  return (user.storageUsed + fileSize) <= limits.storageLimit
}

export function canCreateCommunity(user: User): boolean {
  return TIER_LIMITS[user.subscriptionTier].canCreateCommunities
}

export function shouldShowAds(user: User): boolean {
  return TIER_LIMITS[user.subscriptionTier].hasAds
}

export async function getQuizzesRemainingToday(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return 0

  const limits = TIER_LIMITS[user.subscriptionTier]

  if (limits.maxQuizzesPerDay === Infinity) return Infinity

  // Check if new day
  const lastCreated = user.lastQuizCreatedAt
  const today = new Date()
  const isNewDay = !lastCreated ||
    new Date(lastCreated).toDateString() !== today.toDateString()

  if (isNewDay) {
    // Reset counter for new day
    await prisma.user.update({
      where: { id: userId },
      data: {
        quizzesCreatedToday: 0,
        lastQuizCreatedAt: today,
      },
    })
    return limits.maxQuizzesPerDay
  }

  return Math.max(0, limits.maxQuizzesPerDay - user.quizzesCreatedToday)
}
