import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const email = 'admin@shegerwheels.com'
  const password = 'Admin123!'

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'System Admin',
      passwordHash,
      roles: '["admin"]',
      status: 'active',
      mustChangePassword: false,
    },
    create: {
      email,
      name: 'System Admin',
      passwordHash,
      roles: '["admin"]',
      status: 'active',
      mustChangePassword: false,
    },
  })

  console.log('Admin user ready:', {
    id: user.id,
    email: user.email,
    roles: user.roles,
    status: user.status,
  })
}

main()
  .catch((error) => {
    console.error('Failed to seed admin user:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
