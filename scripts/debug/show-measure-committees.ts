import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const committees = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      name: {
        in: ['Yes to Districts', 'No to Districts']
      }
    },
    select: {
      name: true,
      stateId: true,
      pdc: true
    }
  })

  committees.forEach(entry => {
    console.log(`${entry.name} | stateId=${entry.stateId ?? 'null'} | pdc=${entry.pdc ?? 'null'}`)
  })
}

main()
  .catch(err => {
    console.error('Failed to read measure committees:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
