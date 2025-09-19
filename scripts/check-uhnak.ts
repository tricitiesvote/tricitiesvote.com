import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      name: { contains: 'Uhnak' }
    }
  })
  console.log('Uhnak candidates:', candidates.map(c => c.name))
  
  const candidates2 = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      name: { contains: 'Nic' }
    }
  })
  console.log('Nic candidates:', candidates2.map(c => c.name))
  
  await prisma.$disconnect()
}

check()
