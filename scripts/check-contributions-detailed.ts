import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkContributionsDetailed() {
  try {
    // Get all candidates for 2023
    const allCandidates = await prisma.candidate.count({
      where: {
        electionYear: 2023
      }
    })

    // Get candidates with contributions
    const candidatesWithContributions = await prisma.candidate.count({
      where: {
        electionYear: 2023,
        contributions: {
          some: {}
        }
      }
    })

    // Get total contribution amount
    const totalAmount = await prisma.contribution.aggregate({
      where: {
        electionYear: 2023
      },
      _sum: {
        amount: true
      },
      _avg: {
        amount: true
      }
    })

    console.log(`\n2023 Contribution Summary:`)
    console.log(`- Total candidates: ${allCandidates}`)
    console.log(`- Candidates with contributions: ${candidatesWithContributions}`)
    console.log(`- Candidates without contributions: ${allCandidates - candidatesWithContributions}`)
    console.log(`- Total contribution amount: $${totalAmount._sum.amount?.toFixed(2) || '0.00'}`)
    console.log(`- Average contribution amount: $${totalAmount._avg.amount?.toFixed(2) || '0.00'}`)

    // Get contribution date range
    const dateRange = await prisma.contribution.aggregate({
      where: {
        electionYear: 2023
      },
      _min: {
        date: true
      },
      _max: {
        date: true
      }
    })

    console.log(`\nContribution date range:`)
    console.log(`- Earliest: ${dateRange._min.date?.toISOString().split('T')[0] || 'N/A'}`)
    console.log(`- Latest: ${dateRange._max.date?.toISOString().split('T')[0] || 'N/A'}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkContributionsDetailed()