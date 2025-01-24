import { PrismaClient } from '@prisma/client'
import { migrateBaseData } from './base'
import { migrateYear } from './year'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration...')
  
  try {
    // Step 1: Migrate base data (regions and offices)
    await migrateBaseData()
    
    // Step 2: Migrate each year's data
    const years = [2020, 2021, 2022, 2023]
    for (const year of years) {
      console.log(`\nMigrating ${year} data...`)
      await migrateYear(year)
    }
    
    console.log('\nMigration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 