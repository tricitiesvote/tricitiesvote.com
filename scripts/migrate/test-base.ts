import { PrismaClient } from '@prisma/client'
import { migrateBaseData } from './base'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting base data migration test...\n')
  
  try {
    // Run the base data migration
    await migrateBaseData()
    
    // Verify the results
    console.log('\nVerifying migration results...')
    
    const regions = await prisma.region.findMany({
      include: {
        offices: true
      }
    })
    
    console.log('\nMigrated Regions:')
    for (const region of regions) {
      console.log(`\n${region.name} (${region.code || 'no code'})`)
      console.log('Offices:')
      for (const office of region.offices) {
        console.log(`- ${office.title} (${office.type})`)
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