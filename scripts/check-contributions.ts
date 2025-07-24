import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkContributions() {
  try {
    // Count total contributions for 2023
    const totalCount = await prisma.contribution.count({
      where: {
        electionYear: 2023
      }
    })
    console.log(`Total contributions for 2023: ${totalCount}`)

    // Get candidates with contribution counts
    const candidatesWithContributions = await prisma.candidate.findMany({
      where: {
        electionYear: 2023,
        contributions: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            contributions: true
          }
        }
      },
      orderBy: {
        contributions: {
          _count: 'desc'
        }
      },
      take: 10
    })

    console.log('\nTop 10 candidates by contribution count:')
    candidatesWithContributions.forEach((candidate, index) => {
      console.log(`${index + 1}. ${candidate.name}: ${candidate._count.contributions} contributions`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkContributions()