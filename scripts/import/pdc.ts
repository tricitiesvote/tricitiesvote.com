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
  amount: string
  contribution_date?: string
  receipt_date?: string
  description: string
  cash_or_in_kind?: string | null
}

async function importContributionsForYear(year: number) {
  console.log(`Importing contributions for ${year}...`)
  
  const client = new WAStateClient({
    apiId: process.env.SOCRATA_API_ID || '',
    apiSecret: process.env.SOCRATA_API_SECRET || ''
  })

  let totalImported = 0
  
  try {
    for await (const batch of client.getContributions({ election_year: year.toString() })) {
      for (const contribution of (batch as any)) {
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
    // Skip contributions for candidates not in our database
    return
  }

  // Parse date safely
  const rawDate = contribution.receipt_date || contribution.contribution_date
  const contributionDate = rawDate ? new Date(rawDate) : new Date()
  if (isNaN(contributionDate.getTime())) {
    console.warn(`Invalid date for contribution ${contribution.id}: ${rawDate}`)
    return
  }

  const cashOrInKind = normalizeContributionType(contribution.cash_or_in_kind || null)

  // Create contribution record
  await prisma.contribution.upsert({
    where: {
      id: contribution.id || `${contribution.filer_id}-${contribution.contributor_name}-${contribution.receipt_date}-${contribution.amount}`
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
      amount: parseFloat(contribution.amount) || 0,
      date: contributionDate,
      description: contribution.description,
      cashOrInKind
    },
    update: {
      donorName: contribution.contributor_name,
      donorCity: contribution.contributor_city,
      donorState: contribution.contributor_state,
      donorZip: contribution.contributor_zip,
      donorEmployer: contribution.contributor_employer,
      donorOccupation: contribution.contributor_occupation,
      amount: parseFloat(contribution.amount) || 0,
      date: contributionDate,
      description: contribution.description,
      cashOrInKind
    }
  })
}

function normalizeContributionType(raw: string | null): string | null {
  if (!raw) return null
  const value = raw.trim().toLowerCase()
  if (value === 'cash') return 'cash'
  if (value === 'in-kind' || value === 'in kind' || value === 'inkind') return 'in-kind'
  return null
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
  
  // First get just the candidate IDs to avoid loading everything at once
  const candidateIds = await prisma.candidate.findMany({
    where: { electionYear: year },
    select: { id: true }
  })

  console.log(`Found ${candidateIds.length} candidates to update`)
  let processed = 0
  
  for (const { id } of candidateIds) {
    processed++
    if (processed % 10 === 0) {
      console.log(`  Processed ${processed}/${candidateIds.length} candidates`)
    }
    
    // Load one candidate at a time with their contributions
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { contributions: true }
    })
    
    if (!candidate || candidate.contributions.length === 0) continue;
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
  
  console.log(`Updated donor summaries for ${candidateIds.length} candidates in ${year}`)
  console.log(`Finished processing year ${year}`)
}

if (require.main === module) {
  main()
}
