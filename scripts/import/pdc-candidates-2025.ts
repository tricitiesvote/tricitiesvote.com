#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient, OfficeType } from '@prisma/client'
import { WAStateClient } from '../../lib/wa-state/client'

const prisma = new PrismaClient()

interface PDCCandidate {
  filer_id: string
  filer_name: string
  office: string
  jurisdiction: string
  jurisdiction_county: string
}

// Map PDC office names to our office types
function mapOfficeType(pdcOffice: string): OfficeType {
  const normalized = pdcOffice.toUpperCase()
  if (normalized.includes('CITY COUNCIL')) return OfficeType.CITY_COUNCIL
  if (normalized.includes('SCHOOL')) return OfficeType.SCHOOL_BOARD
  if (normalized.includes('PORT')) return OfficeType.PORT_COMMISSIONER
  if (normalized.includes('MAYOR')) return OfficeType.MAYOR
  return OfficeType.CITY_COUNCIL // default
}

// Extract clean office title from PDC data
function cleanOfficeTitle(pdcOffice: string, jurisdiction: string): string {
  // Handle School Board
  if (pdcOffice.includes('SCHOOL')) {
    if (jurisdiction.includes('KENNEWICK')) return 'Kennewick School Board'
    if (jurisdiction.includes('PASCO')) return 'Pasco School Board'
    if (jurisdiction.includes('RICHLAND')) return 'Richland School Board'
  }
  
  // Handle City Council
  if (pdcOffice.includes('CITY COUNCIL')) {
    if (jurisdiction.includes('KENNEWICK')) return 'Kennewick City Council'
    if (jurisdiction.includes('PASCO')) return 'Pasco City Council'
    if (jurisdiction.includes('RICHLAND')) return 'Richland City Council'
    if (jurisdiction.includes('WEST RICHLAND')) return 'West Richland City Council'
  }
  
  // Handle Mayor
  if (pdcOffice.includes('MAYOR')) {
    if (jurisdiction.includes('KENNEWICK')) return 'Kennewick Mayor'
    if (jurisdiction.includes('PASCO')) return 'Pasco Mayor'
    if (jurisdiction.includes('RICHLAND')) return 'Richland Mayor'
    if (jurisdiction.includes('WEST RICHLAND')) return 'West Richland Mayor'
  }
  
  // Handle Port Commissioner
  if (pdcOffice.includes('PORT')) {
    if (jurisdiction.includes('BENTON')) return 'Port of Benton Commissioner'
    if (jurisdiction.includes('KENNEWICK')) return 'Port of Kennewick Commissioner'
  }
  
  return pdcOffice
}

// Extract position number if present
function extractPosition(pdcOffice: string): number | null {
  const match = pdcOffice.match(/POS(?:ITION)?\s*(\d+)/i)
  return match ? parseInt(match[1]) : null
}

// Map jurisdiction to region
function mapRegion(jurisdiction: string, county: string): string {
  if (jurisdiction.includes('KENNEWICK')) return 'Kennewick'
  if (jurisdiction.includes('PASCO')) return 'Pasco'
  if (jurisdiction.includes('WEST RICHLAND')) return 'Richland' // West Richland goes under Richland
  if (jurisdiction.includes('RICHLAND')) return 'Richland'
  if (county === 'BENTON') return 'Benton County'
  if (county === 'FRANKLIN') return 'Franklin County'
  return 'Tri-Cities'
}

async function importCandidatesFrom2025() {
  console.log('🗳️  Importing 2025 candidates from PDC...\n')
  
  const client = new WAStateClient({
    apiId: process.env.SOCRATA_API_ID || '',
    apiSecret: process.env.SOCRATA_API_SECRET || ''
  })

  // Get unique candidates from contribution data
  const candidateMap = new Map<string, PDCCandidate>()
  
  try {
    for await (const batch of client.getContributions({ election_year: '2025' })) {
      for (const contribution of (batch as any)) {
        if (!candidateMap.has(contribution.filer_id)) {
          candidateMap.set(contribution.filer_id, {
            filer_id: contribution.filer_id,
            filer_name: contribution.filer_name,
            office: contribution.office,
            jurisdiction: contribution.jurisdiction,
            jurisdiction_county: contribution.jurisdiction_county
          })
        }
      }
    }
    
    console.log(`Found ${candidateMap.size} unique candidates in PDC data\n`)
    
    // Process each candidate
    let created = 0
    let skipped = 0
    
    for (const [filerId, pdcCandidate] of candidateMap) {
      // Clean up the name (remove parentheses content)
      const cleanName = pdcCandidate.filer_name.replace(/\s*\([^)]*\)/g, '').trim()
      
      // Determine office and region
      const officeTitle = cleanOfficeTitle(pdcCandidate.office, pdcCandidate.jurisdiction)
      const position = extractPosition(pdcCandidate.office)
      const regionName = mapRegion(pdcCandidate.jurisdiction, pdcCandidate.jurisdiction_county)
      const officeType = mapOfficeType(pdcCandidate.office)
      
      // Build the full office title
      const fullOfficeTitle = position ? `${officeTitle} Pos ${position}` : officeTitle
      
      console.log(`Processing: ${cleanName} for ${fullOfficeTitle} in ${regionName}`)
      
      // Find the region
      const region = await prisma.region.findFirst({
        where: { name: regionName }
      })
      
      if (!region) {
        console.log(`  ⚠️  Region not found: ${regionName}`)
        skipped++
        continue
      }
      
      // Find or create the office
      let office = await prisma.office.findFirst({
        where: {
          title: fullOfficeTitle,
          regionId: region.id
        }
      })
      
      if (!office) {
        // Create the office if it doesn't exist
        const jobTitle = officeType === OfficeType.SCHOOL_BOARD ? 'Board member' :
                        officeType === OfficeType.PORT_COMMISSIONER ? 'Commissioner' :
                        officeType === OfficeType.MAYOR ? 'Mayor' :
                        'Council member'
        
        office = await prisma.office.create({
          data: {
            title: fullOfficeTitle,
            type: officeType,
            regionId: region.id,
            position,
            jobTitle
          }
        })
        console.log(`  ✓ Created office: ${fullOfficeTitle}`)
      }
      
      // Check if candidate already exists
      const existing = await prisma.candidate.findFirst({
        where: {
          name: cleanName,
          electionYear: 2025,
          officeId: office.id
        }
      })
      
      if (!existing) {
        // Create the candidate
        await prisma.candidate.create({
          data: {
            name: cleanName,
            stateId: filerId,
            electionYear: 2025,
            officeId: office.id,
            pdc: `https://www.pdc.wa.gov/browse/campaign-explorer/candidate/${filerId}`
          }
        })
        console.log(`  ✓ Created candidate: ${cleanName}`)
        created++
      } else {
        console.log(`  - Candidate already exists`)
        skipped++
      }
    }
    
    console.log(`\n✅ Import complete!`)
    console.log(`   Created: ${created} candidates`)
    console.log(`   Skipped: ${skipped} candidates`)
    
    // Now create races for offices with candidates
    console.log('\n📋 Creating races for offices with candidates...')
    
    const officesWithCandidates = await prisma.office.findMany({
      where: {
        candidates: {
          some: {
            electionYear: 2025
          }
        }
      },
      include: {
        candidates: {
          where: { electionYear: 2025 }
        },
        region: true
      }
    })
    
    let racesCreated = 0
    for (const office of officesWithCandidates) {
      // Check if race already exists
      const existingRace = await prisma.race.findFirst({
        where: {
          electionYear: 2025,
          officeId: office.id
        }
      })
      
      if (!existingRace) {
        const race = await prisma.race.create({
          data: {
            electionYear: 2025,
            officeId: office.id,
            type: 'GENERAL'
          }
        })
        
        // Link candidates to the race
        for (const candidate of office.candidates) {
          await prisma.candidateRace.create({
            data: {
              candidateId: candidate.id,
              raceId: race.id
            }
          })
        }
        
        // Link race to appropriate guide
        const guide = await prisma.guide.findFirst({
          where: {
            electionYear: 2025,
            regionId: office.regionId
          }
        })
        
        if (guide) {
          await prisma.$executeRaw`
            INSERT INTO "_GuideRaces" ("A", "B") 
            VALUES (${guide.id}, ${race.id})
            ON CONFLICT DO NOTHING
          `
        }
        
        console.log(`  ✓ Created race for ${office.title} with ${office.candidates.length} candidates`)
        racesCreated++
      }
    }
    
    console.log(`\n✅ Created ${racesCreated} races`)
    
  } catch (error) {
    console.error('❌ Error importing candidates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importCandidatesFrom2025()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })