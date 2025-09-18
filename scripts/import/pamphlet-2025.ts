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

// 2025 General Election IDs – Benton County coverage only
const ELECTION_ID = '894' // 2025 General Election (November 4, 2025)
const RACE_IDS = [
  "166498", // Port of Benton - Commissioner District 1
  "166499", // Port of Kennewick - Commissioner District 2
  "166508", // City of West Richland - Council Pos. 1
  "166509", // City of West Richland - Council Pos. 2
  "166510", // City of West Richland - Council Pos. 3
  "166511", // City of West Richland - Council Pos. 4
  "166512", // City of West Richland - Mayor
  "166516", // City of Kennewick - Council Position 1 Ward 1
  "166517", // City of Kennewick - Council Position 2 Ward 2
  "166518", // City of Kennewick - Council Position 3 Ward 3
  "166519", // City of Kennewick - Council Position 4 At Large
  "166522", // City of Richland - Council Pos. 3
  "166523", // City of Richland - Council Pos. 4
  "166524", // City of Richland - Council Pos. 6
  "166525", // City of Richland - Council Pos. 7
  "166526", // Kennewick School District 17 - Director No. 1
  "166527", // Kennewick School District 17 - Director No. 2
  "166537", // Richland School District 400 - Director No. 1
  "166538"  // Richland School District 400 - Director No. 2
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
    nameMatcher.addAlias('Donald Landsman', 'LANDSMAN DONALD C')
    nameMatcher.addAlias('Roy Keck', 'KECK,ROY D.')
    nameMatcher.addAlias('Roy Keck', 'Roy D. Keck')
    nameMatcher.addAlias('Robert Harvey Perkes', 'ROBERT HARVEY PERKES')
    nameMatcher.addAlias('Gloria Tyler Baker', 'Gloria Baker')
    nameMatcher.addAlias('Nic Uhnak', 'Nic (Nicolas) Uhnak')
    
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
