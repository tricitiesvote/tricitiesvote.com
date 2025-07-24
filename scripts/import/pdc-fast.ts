#!/usr/bin/env ts-node
// Fast PDC import using batch operations

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { WAStateClient } from '../../lib/wa-state/client'

const prisma = new PrismaClient()

async function importContributionsForYear(year: number) {
  console.log(`Importing contributions for ${year}...`)
  
  const client = new WAStateClient({
    apiId: process.env.SOCRATA_API_ID || '',
    apiSecret: process.env.SOCRATA_API_SECRET || ''
  })

  // First, get all candidates for this year to build a lookup map
  const candidates = await prisma.candidate.findMany({
    where: { electionYear: year },
    select: { id: true, stateId: true }
  })
  
  const stateIdToCandidate = new Map(
    candidates.map(c => [c.stateId, c.id])
  )
  
  console.log(`Found ${candidates.length} candidates for ${year}`)

  const contributionBatch: any[] = []
  let totalProcessed = 0
  let totalSkipped = 0
  
  try {
    for await (const batch of client.getContributions({ election_year: year.toString() })) {
      for (const contribution of (batch as any)) {
        totalProcessed++
        
        // Skip if no matching candidate
        const candidateId = stateIdToCandidate.get(contribution.filer_id)
        if (!candidateId) {
          totalSkipped++
          continue
        }
        
        // Parse date safely
        const contributionDate = contribution.receipt_date ? new Date(contribution.receipt_date) : new Date()
        if (isNaN(contributionDate.getTime())) {
          totalSkipped++
          continue
        }
        
        contributionBatch.push({
          id: contribution.id || `${contribution.filer_id}-${contribution.contributor_name}-${contribution.receipt_date}-${contribution.amount}`,
          candidateId,
          electionYear: year,
          donorName: contribution.contributor_name || 'Unknown',
          donorCity: contribution.contributor_city || null,
          donorState: contribution.contributor_state || null,
          donorZip: contribution.contributor_zip || null,
          donorEmployer: contribution.contributor_employer || null,
          donorOccupation: contribution.contributor_occupation || null,
          amount: parseFloat(contribution.amount) || 0,
          date: contributionDate,
          description: contribution.description || null
        })
        
        // Batch insert every 500 records
        if (contributionBatch.length >= 500) {
          await batchUpsertContributions(contributionBatch)
          console.log(`Processed ${totalProcessed} contributions (${totalSkipped} skipped)`)
          contributionBatch.length = 0
        }
      }
    }
    
    // Insert remaining contributions
    if (contributionBatch.length > 0) {
      await batchUpsertContributions(contributionBatch)
    }
    
    console.log(`Completed importing ${totalProcessed} contributions for ${year} (${totalSkipped} skipped)`)
    
    // Update donor summaries
    await updateCandidateDonorSummaries(year)
    
  } catch (error) {
    console.error(`Error importing contributions for ${year}:`, error)
    throw error
  }
}

async function batchUpsertContributions(contributions: any[]) {
  // First, delete existing contributions with these IDs to avoid conflicts
  const ids = contributions.map(c => c.id)
  await prisma.contribution.deleteMany({
    where: { id: { in: ids } }
  })
  
  // Then create all new contributions in one batch
  await prisma.contribution.createMany({
    data: contributions,
    skipDuplicates: true
  })
}

async function updateCandidateDonorSummaries(year: number) {
  console.log(`Updating donor summaries for ${year}...`)
  
  // Use aggregation queries instead of loading all data
  const candidateSummaries = await prisma.$queryRaw<Array<{
    candidateId: string,
    totalRaised: number,
    uniqueDonors: bigint
  }>>`
    SELECT 
      "candidateId",
      SUM(amount) as "totalRaised",
      COUNT(DISTINCT "donorName") as "uniqueDonors"
    FROM "Contribution"
    WHERE "electionYear" = ${year}
    GROUP BY "candidateId"
  `
  
  console.log(`Updating ${candidateSummaries.length} candidate summaries`)
  
  // Batch update candidates
  const updatePromises = candidateSummaries.map(summary => {
    const donorSummary = `Reported raised $${Math.round(summary.totalRaised)} from ${summary.uniqueDonors}+ donors`
    
    return prisma.candidate.update({
      where: { id: summary.candidateId },
      data: { donors: donorSummary }
    })
  })
  
  // Execute updates in batches of 20 to avoid overwhelming the database
  for (let i = 0; i < updatePromises.length; i += 20) {
    await Promise.all(updatePromises.slice(i, i + 20))
    if (i % 100 === 0 && i > 0) {
      console.log(`  Updated ${i}/${updatePromises.length} candidates`)
    }
  }
  
  console.log(`Updated donor summaries for ${candidateSummaries.length} candidates in ${year}`)
}

async function main() {
  const years = process.argv.slice(2).map(y => parseInt(y))
  
  if (years.length === 0) {
    console.log('Usage: npm run import:pdc:fast <year1> [year2] [year3]...')
    console.log('Example: npm run import:pdc:fast 2020 2021 2022 2023')
    process.exit(1)
  }
  
  try {
    const startTime = Date.now()
    
    for (const year of years) {
      console.log(`\n=== Starting import for ${year} ===`)
      const yearStart = Date.now()
      
      await importContributionsForYear(year)
      
      const yearTime = Date.now() - yearStart
      console.log(`Completed ${year} in ${Math.round(yearTime / 1000)}s`)
    }
    
    const totalTime = Date.now() - startTime
    console.log(`\n=== All imports completed in ${Math.round(totalTime / 1000)}s ===`)
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}