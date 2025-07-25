#!/usr/bin/env node
/**
 * Checks for candidate name mismatches between different data sources
 * Usage: npx tsx scripts/utils/check-name-matches.ts [year]
 * 
 * This helps identify when candidate names in the database don't match
 * names from voter pamphlet or other sources, so you can add aliases.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNameMatches(year: number = 2025) {
  console.log(`\n🔍 Checking name matches for ${year} election...\n`)
  
  try {
    // Get all candidates for the year
    const candidates = await prisma.candidate.findMany({
      where: { electionYear: year },
      select: { 
        name: true,
        stateId: true,
        office: {
          select: {
            title: true,
            region: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`Found ${candidates.length} candidates in database:\n`)
    
    // Group by region
    const byRegion = candidates.reduce((acc, candidate) => {
      const region = candidate.office.region.name
      if (!acc[region]) acc[region] = []
      acc[region].push(candidate)
      return acc
    }, {} as Record<string, typeof candidates>)
    
    // Display by region
    Object.entries(byRegion).forEach(([region, regionCandidates]) => {
      console.log(`${region}:`)
      regionCandidates.forEach(c => {
        console.log(`  - ${c.name} (${c.office.title})${c.stateId ? ` [PDC: ${c.stateId}]` : ''}`)
      })
      console.log()
    })
    
    // Check for potential issues
    console.log('🚨 Potential name issues to check:')
    
    // Check for all caps names
    const allCapsNames = candidates.filter(c => c.name === c.name.toUpperCase())
    if (allCapsNames.length > 0) {
      console.log('\nAll caps names (may need normalization):')
      allCapsNames.forEach(c => console.log(`  - ${c.name}`))
    }
    
    // Check for names with special formatting
    const specialNames = candidates.filter(c => 
      c.name.includes(',') || 
      c.name.includes('.') || 
      c.name.includes('-') ||
      c.name.match(/\s{2,}/) // Multiple spaces
    )
    if (specialNames.length > 0) {
      console.log('\nNames with special characters or formatting:')
      specialNames.forEach(c => console.log(`  - ${c.name}`))
    }
    
    // Suggest name mapping format
    if (allCapsNames.length > 0 || specialNames.length > 0) {
      console.log('\n📝 Suggested name mappings for load-config-names.json:')
      console.log('```json')
      const suggestions = [...allCapsNames, ...specialNames].map(c => ({
        formattedName: c.name.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ').replace(/,/g, '').replace(/\s+/g, ' ').trim(),
        pdcId: c.stateId || 'UNKNOWN',
        altNames: [c.name]
      }))
      console.log(JSON.stringify(suggestions, null, 2))
      console.log('```')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  const year = parseInt(process.argv[2] || '2025')
  checkNameMatches(year)
}

export { checkNameMatches }