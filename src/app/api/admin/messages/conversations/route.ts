import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const user = await requireAuth()
    requireAdmin(user.role as any)

    // Get recent conversations with participants and last message
    const conversations = await prisma.conversation.findMany({
      take: 50,
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        Message: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            User: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            Message: true,
          },
        },
      },
    })

    const conversationsWithDetails = conversations.map((conv) => ({
      id: conv.id,
      participants: conv.ConversationParticipant,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv._count.Message,
      lastMessage: conv.Message[0]
        ? {
            content: conv.Message[0].content,
            createdAt: conv.Message[0].createdAt,
            sender: conv.Message[0].User,
          }
        : undefined,
    }))

    return NextResponse.json({
      conversations: conversationsWithDetails,
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
