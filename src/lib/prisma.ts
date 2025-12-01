import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database connection on startup
if (process.env.NODE_ENV === 'production') {
  // Check if using internal Railway URL (won't work from Vercel)
  if (process.env.DATABASE_URL?.includes('railway.internal')) {
    console.error('❌ ERROR: Using internal Railway URL!')
    console.error('Please update DATABASE_URL in Vercel to use DATABASE_PUBLIC_URL from Railway')
    console.error('Current URL contains: railway.internal (this only works inside Railway)')
    console.error('Should use: switchback.proxy.rlwy.net or containers-xxx.railway.app')
  }
  
  prisma.$connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message)
      if (process.env.DATABASE_URL?.includes('railway.internal')) {
        console.error('⚠️  You are using the internal Railway URL. Use DATABASE_PUBLIC_URL instead!')
      }
      console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing')
    })
}

export default prisma
