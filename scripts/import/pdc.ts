// scripts/import/pdc.ts - Import PDC contribution data for all years
import { PrismaClient } from '@prisma/client'
import { WAStateClient } from '../../lib/wa-state'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

interface PDCContribution {
  id: string
  filer_id: string
  election_year: string
  contributor_name: string
  contributor_address: string
  contributor_city: string
  contributor_state: string
  contributor_zip: string
  contributor_employer: string
  contributor_occupation: string
  contribution_amount: string
  contribution_date: string
  description: string
}

async function importContributionsForYear(year: number) {
  console.log(`Importing contributions for ${year}...`)
  
  const client = new WAStateClient({
    apiId: process.env.SOCRATA_APP_TOKEN || '',
    apiSecret: process.env.SOCRATA_PASSWORD || ''
  })

  let totalImported = 0
  
  try {
    for await (const batch of client.getContributions({ election_year: year.toString() })) {
      for (const contribution of batch) {
        await processContribution(contribution as any, year)
        totalImported++
        
        if (totalImported % 100 === 0) {
          console.log(`Processed ${totalImported} contributions for ${year}`)
        }
      }
    }
    
    console.log(`Completed importing ${totalImported} contributions for ${year}`)
  } catch (error) {
    console.error(`Error importing contributions for ${year}:`, error)
    throw error
  }
}

async function processContribution(contribution: PDCContribution, year: number) {
  // Find candidate by PDC filer_id (stateId in our schema)
  const candidate = await prisma.candidate.findFirst({
    where: {
      stateId: contribution.filer_id,
      electionYear: year
    }
  })

  if (!candidate) {
    console.warn(`Candidate not found for filer_id: ${contribution.filer_id} in ${year}`)
    return
  }

  // Create contribution record
  await prisma.contribution.upsert({
    where: {
      id: contribution.id || `${contribution.filer_id}-${contribution.contributor_name}-${contribution.contribution_date}-${contribution.contribution_amount}`
    },
    create: {
      candidateId: candidate.id,
      electionYear: year,
      donorName: contribution.contributor_name,
      donorCity: contribution.contributor_city,
      donorState: contribution.contributor_state,
      donorZip: contribution.contributor_zip,
      donorEmployer: contribution.contributor_employer,
      donorOccupation: contribution.contributor_occupation,
      amount: parseFloat(contribution.contribution_amount) || 0,
      date: new Date(contribution.contribution_date),
      description: contribution.description
    },
    update: {
      donorName: contribution.contributor_name,
      donorCity: contribution.contributor_city,
      donorState: contribution.contributor_state,
      donorZip: contribution.contributor_zip,
      donorEmployer: contribution.contributor_employer,
      donorOccupation: contribution.contributor_occupation,
      amount: parseFloat(contribution.contribution_amount) || 0,
      date: new Date(contribution.contribution_date),
      description: contribution.description
    }
  })
}

async function main() {
  const years = process.argv.slice(2).map(y => parseInt(y))
  
  if (years.length === 0) {
    console.log('Usage: npm run import:pdc <year1> [year2] [year3]...')
    console.log('Example: npm run import:pdc 2020 2021 2022 2023')
    process.exit(1)
  }
  
  try {
    for (const year of years) {
      console.log(`\n=== Starting import for ${year} ===`)
      await importContributionsForYear(year)
      
      // After importing contributions, update candidate donor summaries
      await updateCandidateDonorSummaries(year)
    }
    
    console.log('\n=== All imports completed successfully ===')
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function updateCandidateDonorSummaries(year: number) {
  console.log(`Updating donor summaries for ${year}...`)
  
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: year },
    include: {
      contributions: true
    }
  })

  for (const candidate of candidates) {
    const totalRaised = candidate.contributions.reduce((sum, c) => sum + c.amount, 0)
    const uniqueDonors = new Set(candidate.contributions.map(c => c.donorName)).size
    const topDonors = candidate.contributions
      .reduce((acc, c) => {
        const existing = acc.find(d => d.name === c.donorName)
        if (existing) {
          existing.amount += c.amount
        } else {
          acc.push({ name: c.donorName, amount: c.amount })
        }
        return acc
      }, [] as Array<{ name: string, amount: number }>)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Update the candidate's donors field with summary info
    const donorSummary = `Reported raised $${totalRaised.toFixed(0)} from ${uniqueDonors}+ donors`
    
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { donors: donorSummary }
    })
  }
  
  console.log(`Updated donor summaries for ${candidates.length} candidates in ${year}`)
}

if (require.main === module) {
  main()
}