import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import { migrateDynamicBase } from './dynamic-base'
import { migrateYearFromBranch } from './year'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting complete historical data migration...\n')
  
  // Get current branch to return to later
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  console.log(`Current branch: ${currentBranch}`)
  
  try {
    // Step 1: Migrate base data (regions and offices) dynamically
    console.log('\n=== MIGRATING BASE DATA (DYNAMIC) ===')
    await migrateDynamicBase()
    
    // Step 2: Migrate each year's data from its respective branch
    const years = [2020, 2021, 2022, 2023]
    
    for (const year of years) {
      console.log(`\n=== MIGRATING ${year} DATA ===`)
      
      if (year === 2023) {
        // 2023 data is already in the refactor branch
        console.log('Using 2023 data from refactor branch...')
        await migrateYearFromBranch(year, 'refactor')
      } else {
        // Other years need to be imported from their respective branches
        console.log(`Switching to ${year} branch...`)
        try {
          // Stash current changes before switching
          execSync('git stash push -m "WIP: migration script changes"', { stdio: 'pipe' })
          execSync(`git checkout ${year}`, { stdio: 'inherit' })
          await migrateYearFromBranch(year, year.toString())
          // Return to refactor branch
          execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' })
          // Restore stashed changes
          execSync('git stash pop', { stdio: 'pipe' })
        } catch (error) {
          console.error(`Failed to checkout or migrate ${year}:`, error)
          // Try to return to original branch
          try {
            execSync(`git checkout ${currentBranch}`, { stdio: 'pipe' })
            execSync('git stash pop', { stdio: 'pipe' })
          } catch (restoreError) {
            console.error('Failed to restore original state:', restoreError)
          }
          // Continue with other years
        }
      }
    }
    
    console.log('\n=== MIGRATION SUMMARY ===')
    const summary = await getMigrationSummary()
    console.log(summary)
    
    console.log('\nHistorical data migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    // Ensure we're on the original branch
    const currentBranchCheck = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    if (currentBranchCheck !== currentBranch) {
      console.log(`\nReturning to ${currentBranch} branch...`)
      try {
        execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' })
      } catch (error) {
        console.error('Failed to return to original branch:', error)
      }
    }
    
    await prisma.$disconnect()
  }
}

async function getMigrationSummary() {
  const candidates = await prisma.candidate.count()
  const offices = await prisma.office.count()
  const regions = await prisma.region.count()
  const races = await prisma.race.count()
  const endorsements = await prisma.endorsement.count()
  
  const yearBreakdown = await prisma.candidate.groupBy({
    by: ['electionYear'],
    _count: {
      id: true
    },
    orderBy: {
      electionYear: 'asc'
    }
  })
  
  let summary = `
Total Records:
- Candidates: ${candidates}
- Offices: ${offices}
- Regions: ${regions}
- Races: ${races}
- Endorsements: ${endorsements}

Candidates by Year:
`
  
  for (const year of yearBreakdown) {
    summary += `- ${year.electionYear}: ${year._count.id} candidates\n`
  }
  
  return summary
}

main()