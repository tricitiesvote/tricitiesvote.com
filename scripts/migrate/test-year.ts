import { PrismaClient } from '@prisma/client'
import { migrateYear } from './year'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting 2023 data migration test...\n')
  
  try {
    // Run the 2023 data migration
    await migrateYear(2023)
    
    // Verify the results
    console.log('\nVerifying migration results...')
    
    const candidates = await prisma.candidate.findMany({
      where: { electionYear: 2023 },
      include: {
        office: true,
        races: {
          include: {
            race: true
          }
        },
        endorsements: true
      }
    })
    
    console.log('\nMigrated Candidates:')
    for (const candidate of candidates) {
      console.log(`\n${candidate.name} (${candidate.office.title})`)
      console.log('Races:')
      for (const candidateRace of candidate.races) {
        console.log(`- ${candidateRace.race.type} Election`)
      }
      if (candidate.endorsements.length > 0) {
        console.log('Endorsements:')
        for (const endorsement of candidate.endorsements) {
          console.log(`- ${endorsement.endorser} (${endorsement.type})`)
        }
      }
    }
    
    console.log('\nMigration test completed successfully!')
  } catch (error) {
    console.error('Migration test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 