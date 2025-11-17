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
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    const conversationsWithDetails = conversations.map((conv) => ({
      id: conv.id,
      participants: conv.participants,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0]
        ? {
            content: conv.messages[0].content,
            createdAt: conv.messages[0].createdAt,
            sender: conv.messages[0].sender,
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
