import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const pascoCandidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      office: {
        region: { name: 'Pasco' }
      }
    },
    select: {
      name: true,
      image: true,
      statement: true,
      email: true,
      office: {
        select: { title: true }
      }
    }
  })

  console.log('\n📋 Pasco candidates data status:\n')
  pascoCandidates.forEach(c => {
    console.log(`${c.name} (${c.office.title}):`)
    console.log(`  Image: ${c.image || 'MISSING'}`)
    console.log(`  Statement: ${c.statement ? 'YES' : 'NO'}`)
    console.log(`  Email: ${c.email || 'none'}`)
    console.log('')
  })

  await prisma.$disconnect()
}

check()
