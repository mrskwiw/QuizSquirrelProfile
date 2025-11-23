import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    console.log('Creating test users...')

    const now = new Date()
    const users = [
      {
        id: randomUUID(),
        email: 'alice@test.com',
        username: 'alice',
        displayName: 'Alice Test',
        password: await bcrypt.hash('password123', 10),
        updatedAt: now,
      },
      {
        id: randomUUID(),
        email: 'bob@test.com',
        username: 'bob',
        displayName: 'Bob Test',
        password: await bcrypt.hash('password123', 10),
        updatedAt: now,
      },
    ]

    for (const userData of users) {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existing) {
        console.log(`User ${userData.username} already exists (${existing.id})`)
        continue
      }

      const user = await prisma.user.create({
        data: userData,
      })

      console.log(`✓ Created user: ${user.username} (${user.id})`)
    }

    // Print all users for reference
    console.log('\nAll users in database:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    allUsers.forEach((u) => {
      console.log(`  - ${u.username} (${u.email}): ${u.id}`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
