import { PrismaClient } from '@prisma/client'
import * as fs from 'fs/promises'
import glob from 'glob-promise'
import { readJsonFile } from './utils'

const prisma = new PrismaClient()

interface LegacyCandidateData {
  name: string
  slug: string
  uuid?: string
  electionyear: string
  office: string
}

interface LegacyRaceData {
  electionyear: string
  hide?: boolean
  uuid: string
  office: string
  type: string
  candidates: string[]
}

async function validateCandidates() {
  console.log('\nValidating Candidates...')
  
  // Get all 2023 candidates from database
  const dbCandidates = await prisma.candidate.findMany({
    where: { electionYear: 2023 },
    include: { office: true }
  })
  
  // Get all 2023 candidate files
  const candidateFiles = await glob('legacy/data/json/candidates/2023-*.json')
  const sourceCount = candidateFiles.length
  
  // Track processed candidates to detect duplicates
  const processedCandidates = new Set<string>()
  
  console.log(`Source candidates: ${sourceCount}`)
  console.log(`Database candidates: ${dbCandidates.length}`)
  
  if (sourceCount !== dbCandidates.length) {
    console.error('❌ Candidate count mismatch!')
    
    // Find duplicates in database
    const candidatesByStateId = new Map<string, number>()
    for (const candidate of dbCandidates) {
      if (!candidate.stateId) {
        console.error(`  Candidate missing stateId: ${candidate.name}`)
        continue
      }
      const count = candidatesByStateId.get(candidate.stateId) || 0
      candidatesByStateId.set(candidate.stateId, count + 1)
    }
    
    // Report duplicates
    for (const [stateId, count] of candidatesByStateId.entries()) {
      if (count > 1) {
        const dupes = dbCandidates.filter(c => c.stateId === stateId)
        console.error(`  Duplicate candidate in DB: stateId=${stateId} (${count} times)`)
        for (const dupe of dupes) {
          console.error(`    - ${dupe.name} (${dupe.office.title})`)
        }
      }
    }
  } else {
    console.log('✓ Candidate count matches')
  }
  
  // Validate each candidate's data
  for (const file of candidateFiles) {
    const data = await readJsonFile<LegacyCandidateData>(file)
    const dbCandidate = dbCandidates.find(c => 
      c.stateId === (data.uuid || data.slug)
    )
    
    if (!dbCandidate) {
      console.error(`❌ Missing candidate in DB: ${data.name}`)
      continue
    }
    
    // Validate required fields
    const fieldsMatch = 
      dbCandidate.name === data.name &&
      dbCandidate.electionYear === parseInt(data.electionyear) &&
      dbCandidate.office.title === data.office
      
    if (!fieldsMatch) {
      console.error(`❌ Data mismatch for candidate: ${data.name}`)
      if (dbCandidate.name !== data.name) {
        console.error(`  Name mismatch: expected "${data.name}", got "${dbCandidate.name}"`)
      }
      if (dbCandidate.electionYear !== parseInt(data.electionyear)) {
        console.error(`  Year mismatch: expected ${data.electionyear}, got ${dbCandidate.electionYear}`)
      }
      if (dbCandidate.office.title !== data.office) {
        console.error(`  Office mismatch: expected "${data.office}", got "${dbCandidate.office.title}"`)
      }
    }
  }
}

async function validateRaces() {
  console.log('\nValidating Races...')
  
  // Get all 2023 races from database
  const dbRaces = await prisma.race.findMany({
    where: { electionYear: 2023 },
    include: { 
      office: true,
      candidates: {
        include: { candidate: true }
      }
    }
  })
  
  // Get all 2023 race files
  const raceFiles = await glob('legacy/data/json/races/2023-*.json')
  const sourceCount = raceFiles.length
  
  console.log(`Source races: ${sourceCount}`)
  console.log(`Database races: ${dbRaces.length}`)
  
  if (sourceCount !== dbRaces.length) {
    console.error('❌ Race count mismatch!')
  } else {
    console.log('✓ Race count matches')
  }
  
  // Show all races in database
  console.log('\nRaces in database:')
  for (const race of dbRaces) {
    console.log(`- ${race.office.title} (${race.type})`)
    console.log(`  Candidates:`)
    for (const candidateRace of race.candidates) {
      console.log(`    - ${candidateRace.candidate.name}`)
    }
  }
  
  console.log('\nValidating each race file:')
  // Validate each race's data
  for (const file of raceFiles) {
    const data = await readJsonFile<LegacyRaceData>(file)
    const dbRace = dbRaces.find(r => 
      r.office.title === data.office &&
      r.type === data.type.toUpperCase()
    )
    
    if (!dbRace) {
      console.error(`❌ Missing race in DB: ${data.office} (${data.type})`)
      continue
    }
    
    // Validate candidate count
    if (dbRace.candidates.length !== data.candidates.length) {
      console.error(`❌ Candidate count mismatch for race: ${data.office}`)
      console.log(`  Expected: ${data.candidates.length}, Got: ${dbRace.candidates.length}`)
      
      // Show candidate details
      console.log('  Source candidates:')
      for (const candidateRef of data.candidates) {
        console.log(`    - ${candidateRef}`)
      }
      console.log('  Database candidates:')
      for (const candidateRace of dbRace.candidates) {
        console.log(`    - ${candidateRace.candidate.name} (${candidateRace.candidate.stateId})`)
      }
    }
  }
}

async function validateEndorsements() {
  console.log('\nValidating Endorsements...')
  
  // Get all 2023 endorsements from database
  const dbEndorsements = await prisma.endorsement.findMany({
    where: {
      candidate: {
        electionYear: 2023
      }
    },
    include: { candidate: true }
  })
  
  // Get all 2023 endorsement files
  const endorsementFiles = await glob('legacy/data/json/endorsements/2023-*.json')
  let totalSourceEndorsements = 0
  
  for (const file of endorsementFiles) {
    const endorsements = await readJsonFile<Record<string, any[]>>(file)
    for (const endorsementList of Object.values(endorsements)) {
      totalSourceEndorsements += endorsementList.length
    }
  }
  
  console.log(`Source endorsements: ${totalSourceEndorsements}`)
  console.log(`Database endorsements: ${dbEndorsements.length}`)
  
  if (totalSourceEndorsements !== dbEndorsements.length) {
    console.error('❌ Endorsement count mismatch!')
  } else {
    console.log('✓ Endorsement count matches')
  }
}

async function main() {
  console.log('Starting 2023 data validation...')
  
  try {
    await validateCandidates()
    await validateRaces()
    await validateEndorsements()
    
    console.log('\nValidation completed!')
  } catch (error) {
    console.error('Validation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 