import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      office: {
        region: {
          name: { in: ['Pasco', 'Kennewick', 'Richland'] }
        }
      }
    },
    include: {
      office: {
        include: { region: true }
      }
    }
  })

  const stats = {
    total: candidates.length,
    withStatement: candidates.filter(c => c.statement).length,
    withImage: candidates.filter(c => c.image).length,
    withEmail: candidates.filter(c => c.email).length,
    withWebsite: candidates.filter(c => c.website).length
  }

  console.log('\n📊 2025 Candidate Data Coverage:\n')
  console.log(`Total candidates: ${stats.total}`)
  console.log(`With statements: ${stats.withStatement} (${Math.round(stats.withStatement/stats.total*100)}%)`)
  console.log(`With images: ${stats.withImage} (${Math.round(stats.withImage/stats.total*100)}%)`)
  console.log(`With email: ${stats.withEmail} (${Math.round(stats.withEmail/stats.total*100)}%)`)
  console.log(`With website: ${stats.withWebsite} (${Math.round(stats.withWebsite/stats.total*100)}%)`)

  // Show any candidates still missing data
  const incomplete = candidates.filter(c => !c.statement || !c.image)
  if (incomplete.length > 0) {
    console.log('\n⚠️  Candidates missing statement or image:')
    incomplete.forEach(c => {
      const missing = []
      if (!c.statement) missing.push('statement')
      if (!c.image) missing.push('image')
      console.log(`  - ${c.name} (${c.office.region.name}): missing ${missing.join(', ')}`)
    })
  }

  await prisma.$disconnect()
}

check()
