import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const jobs = await prisma.job.findMany()
    console.log('Successfully connected! Jobs found:', jobs.length)
  } catch (err) {
    console.error('Connection failed:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
