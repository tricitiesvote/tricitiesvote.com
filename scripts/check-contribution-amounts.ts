import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkContributionAmounts() {
  try {
    // Sample some contributions to see the data
    const sampleContributions = await prisma.contribution.findMany({
      where: {
        electionYear: 2023
      },
      take: 10,
      include: {
        candidate: {
          select: {
            name: true
          }
        }
      }
    })

    console.log('Sample contributions for 2023:')
    sampleContributions.forEach((contrib, index) => {
      console.log(`\n${index + 1}. Candidate: ${contrib.candidate.name}`)
      console.log(`   Donor: ${contrib.donorName}`)
      console.log(`   Amount: $${contrib.amount}`)
      console.log(`   Date: ${contrib.date.toISOString().split('T')[0]}`)
      console.log(`   Type: ${contrib.cashOrInKind || 'Not specified'}`)
      console.log(`   Description: ${contrib.description || 'None'}`)
    })

    // Check distribution of amounts
    const amountBreakdown = await prisma.contribution.groupBy({
      by: ['amount'],
      where: {
        electionYear: 2023
      },
      _count: {
        amount: true
      },
      orderBy: {
        _count: {
          amount: 'desc'
        }
      },
      take: 10
    })

    console.log('\n\nTop 10 contribution amounts by frequency:')
    amountBreakdown.forEach((group) => {
      console.log(`$${group.amount}: ${group._count.amount} contributions`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkContributionAmounts()