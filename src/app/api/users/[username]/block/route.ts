import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireAuth()
    const { username } = await params

    // Look up user by username
    const userToBlock = await prisma.user.findUnique({
      where: { username },
      select: { id: true, role: true },
    })

    if (!userToBlock) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const blockedId = userToBlock.id

    // Can't block yourself
    if (user.id === blockedId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      )
    }

    // Prevent blocking admins
    if (userToBlock.role === 'ADMIN' || userToBlock.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot block admin users' },
        { status: 403 }
      )
    }

    // Check if already blocked
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId,
        },
      },
    })

    if (existingBlock) {
      return NextResponse.json(
        { error: 'User already blocked' },
        { status: 400 }
      )
    }

    // Create block
    await prisma.userBlock.create({
      data: {
        blockerId: user.id,
        blockedId,
      },
    })

    // Remove follow relationships if they exist
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: blockedId },
          { followerId: blockedId, followingId: user.id },
        ],
      },
    })

    return NextResponse.json({
      message: 'User blocked successfully',
      blocked: true,
    })
  } catch (error) {
    console.error('Error blocking user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to block user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireAuth()
    const { username } = await params

    // Look up user by username
    const userToUnblock = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!userToUnblock) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const blockedId = userToUnblock.id

    // Delete the block
    const result = await prisma.userBlock.deleteMany({
      where: {
        blockerId: user.id,
        blockedId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'User unblocked successfully',
      blocked: false,
    })
  } catch (error) {
    console.error('Error unblocking user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unblock user' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await requireAuth()
    const { username } = await params

    // Look up user by username
    const userToCheck = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!userToCheck) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userToCheck.id

    const block = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: userId,
        },
      },
    })

    return NextResponse.json({
      blocked: !!block,
    })
  } catch (error) {
    console.error('Error checking block status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check block status' },
      { status: 500 }
    )
  }
}
