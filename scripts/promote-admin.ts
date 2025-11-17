import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function promoteToAdmin() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    console.log('Current users in database:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`)
    })

    if (users.length === 0) {
      console.log('No users found in the database.')
      return
    }

    if (users.length === 1) {
      const user = users[0]
      console.log(`\nPromoting user "${user.username}" to ADMIN...`)

      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      })

      console.log(`✅ Successfully promoted ${user.username} to ADMIN!`)
    } else {
      console.log('\nMultiple users found. Please specify which user to promote.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

promoteToAdmin()
