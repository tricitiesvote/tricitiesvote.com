#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { WAStateClient } from '../../lib/wa-state/client'
import { normalizeLocalOffice } from '../../lib/normalize/offices'
import { CANDIDATE_SEAT_MAP } from './2025-seats'

const prisma = new PrismaClient()

interface PDCCandidate {
  filer_id: string
  filer_name: string
  office: string
  jurisdiction: string
  jurisdiction_county: string
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

    const regions = await prisma.region.findMany({
      select: { id: true, name: true }
    })
    const regionLookup = new Map(regions.map(region => [region.name, region.id]))
    
    for (const [filerId, pdcCandidate] of candidateMap) {
      // Clean up the name (remove parentheses content)
      const cleanName = pdcCandidate.filer_name.replace(/\s*\([^)]*\)/g, '').trim()
      
      const candidateKey = cleanName.toUpperCase()
      const mappedSeat = CANDIDATE_SEAT_MAP[candidateKey]

      if (!mappedSeat) {
        console.log(`  • Skipping ${cleanName} — not on general roster`)
        skipped++
        continue
      }

      const normalized = normalizeLocalOffice({
        office: mappedSeat.office,
        jurisdiction: mappedSeat.jurisdiction
      })

      if (!normalized) {
        console.log(`  • Skipping ${cleanName} — unable to normalize ${mappedSeat.office}`)
        skipped++
        continue
      }

      const regionId = regionLookup.get(normalized.regionName)
      if (!regionId) {
        console.log(`  ⚠️  Region not found for ${normalized.regionName}`)
        skipped++
        continue
      }

      console.log(`Processing: ${cleanName} for ${normalized.officeTitle}`)
      
      // Find the region
      const region = regionId
      
      // Find or create the office
      let office = await prisma.office.findFirst({
        where: {
          title: normalized.officeTitle,
          regionId: region
        }
      })
      
      if (!office) {
        office = await prisma.office.create({
          data: {
            title: normalized.officeTitle,
            type: normalized.officeType,
            regionId: region,
            position: normalized.position,
            jobTitle: normalized.jobTitle
          }
        })
        console.log(`  ✓ Created office: ${normalized.officeTitle}`)
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
