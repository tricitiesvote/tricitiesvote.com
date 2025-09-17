#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import { PamphletClient } from '../../lib/wa-state/pamphlet'
import { NameMatcher } from '../../lib/normalize/names'
import * as dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

dotenv.config()

const prisma = new PrismaClient()
const nameMatcher = new NameMatcher()

// 2025 Primary Election IDs
const ELECTION_ID = '893' // 2025 Primary Election (August 5, 2025)
const RACE_IDS = [
  "162487", // Kennewick Ward District #2 - Council Position 2 Ward 2
  "162488", // City Of Richland - Council Pos. 7
  "162489", // City Of West Richland - Mayor
  "162490", // City Of West Richland - Council Pos. 3
  "162491", // Kennewick Public Hospital District - Commissioner Pos. 5
  "162493", // Richland School District 400 - Director No. 1
  "162505", // Port Of Kennewick-Dist 2 - Commissioner District 2
  "162506", // Kennewick School District 17 - Director No. 1
  "162583", // Kennewick Ward District #1 - Council Position 1 Ward 1
  "162584", // City Of West Richland - Council Pos. 2
  "162602", // Kennewick Ward District #3 - Council Position 3 Ward 3
  "162603", // City Of Kennewick - Council Position 4 At Large
  "162604", // City Of West Richland - Council Pos. 1
  "162605", // City Of West Richland - Council Pos. 4
  "162607", // Kennewick Public Hospital District - Commissioner Pos. 4
  "162621", // City Of Richland - Council Pos. 3
  "162622", // City Of Richland - Council Pos. 6
  "162623", // City Of Richland - Council Pos. 4
  "162625", // Kennewick Public Hospital District - Commissioner Pos. 6
  "162682", // Richland School District 400 - Director No. 2
  "164278", // Port of Benton-Dist 1 - Commissioner District 1
  "164279", // Kennewick School District 17 - Director No. 2
  "164351", // Pasco Port District 3 - Commissioner, District 3
  "165057", // Pasco Port District 2 - Commissioner, District 2
  "165654", // Kennewick Public Hospital District - Commissioner Pos. 1
  // Pasco races
  "162816", // City Of Pasco District 1
  "164348", // City Of Pasco District 3
  "162908", // City Of Pasco District 4
  "165056", // City Of Pasco District 6
  "165491", // Pasco School District, Director District 3
  "165492", // Pasco School District, Director District 4
  "165493"  // Pasco School District No. 1 - At Large, Position 5
]

async function importPamphletData() {
  console.log('🗳️  Importing 2025 voter pamphlet data...\n')
  
  // Verify we have the required election data
  console.log(`📊 Election ID: ${ELECTION_ID}`)
  console.log(`📊 Number of races: ${RACE_IDS.length}`)

  try {
    // Load existing candidates to build name matcher
    const candidates = await prisma.candidate.findMany({
      where: { electionYear: 2025 },
      select: { name: true }
    })
    
    // Add all candidate names to the matcher
    candidates.forEach(candidate => {
      nameMatcher.addKnownName(candidate.name, candidate.name)
    })
    
    // Add known aliases for 2025 candidates
    nameMatcher.addAlias('Anthony E Sanchez', 'Tony Sanchez')
    nameMatcher.addAlias('LANDSMAN DONALD C', 'Donald Landsman')
    nameMatcher.addAlias('KECK,ROY D.', 'Roy Keck')
    nameMatcher.addAlias('KECK,ROY D.', 'Roy D. Keck')
    
    // Additional Pasco candidates
    nameMatcher.addAlias('Mark Anthony Figueroa', 'Mark Figueroa')
    nameMatcher.addAlias('Leo A. Perales', 'Leo Perales')
    nameMatcher.addAlias('Bryan Verhei', 'Bryan A. Verhei')
    nameMatcher.addAlias('Pete Serrano', 'Peter Serrano')
    nameMatcher.addAlias('Steve Christensen', 'Steven Christensen')
    nameMatcher.addAlias('Matt Watkins', 'Matthew Watkins')
    nameMatcher.addAlias('Hans-Joachim Engelke', 'H.J. Engelke')
    nameMatcher.addAlias('Hans-Joachim Engelke', 'Hans Engelke')
    
    // Ensure image directory exists
    const imageDir = path.join(process.cwd(), 'public/images/candidates/2025')
    await fs.mkdir(imageDir, { recursive: true })
    
    // Initialize pamphlet client
    const pamphlet = new PamphletClient({
      electionId: ELECTION_ID,
      raceIds: RACE_IDS,
      imageDir: imageDir,
      publicImagePath: '/images/candidates/2025'
    }, nameMatcher, prisma)
    
    console.log('Fetching candidate data from voter pamphlet...')
    await pamphlet.fetchCandidateData()
    
    // Update candidate statements and photos
    console.log('\n✅ Pamphlet import complete!')
    
    // Show summary
    const updatedCandidates = await prisma.candidate.count({
      where: {
        electionYear: 2025,
        OR: [
          { image: { not: null } },
          { statement: { not: null } }
        ]
      }
    })
    
    console.log(`\n📊 Summary:`)
    console.log(`   Updated ${updatedCandidates} candidates with pamphlet data`)
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Alternative approach: Try to fetch data for known candidates
async function tryFetchForKnownCandidates() {
  console.log('\n🔍 Attempting to find election/race IDs by testing known candidates...')
  
  // We could try to search for election IDs by iterating through possible values
  // This is a backup approach if we can't get the official IDs
  
  const testElectionIds = ['900', '901', '902', '903', '904', '905'] // Common pattern
  const baseUrl = 'https://voter.votewa.gov/elections/electionlist.ashx'
  
  for (const eid of testElectionIds) {
    try {
      const response = await fetch(baseUrl)
      const text = await response.text()
      if (text.includes('2025')) {
        console.log(`Found potential 2025 election ID: ${eid}`)
      }
    } catch (error) {
      // Continue searching
    }
  }
}

// Main execution
if (process.argv.includes('--search')) {
  tryFetchForKnownCandidates()
} else {
  importPamphletData()
}