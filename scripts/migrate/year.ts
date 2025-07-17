import { PrismaClient, ElectionType } from '@prisma/client'
import * as fs from 'fs/promises'
import * as path from 'path'
import glob from 'glob-promise'
import { readJsonFile } from './utils'

const prisma = new PrismaClient()

interface LegacyCandidateData {
  name: string
  slug: string
  email?: string
  pamphlet_url?: string
  image?: string
  pdc_url?: string
  uuid?: string
  party?: string
  statement?: string
  electionyear: string
  office: string
  website?: string
  facebook?: string
  twitter?: string
  instagram?: string
  youtube?: string
  fields?: {
    bio_html?: string
    body_html?: string
    statement_html?: string
    engagement_html?: string
    articles_html?: string
    fundraising?: any
  }
}

interface LegacyRaceData {
  electionyear: string
  hide?: boolean
  uuid: string
  office: string
  type: string
  candidates: string[]
  intro?: string
  body?: string
}

interface CandidateMapping {
  id: string
  slug: string
  pdcId?: string
}

export async function migrateYear(year: number) {
  console.log(`\nMigrating year ${year}...`)
  
  // Step 1: Migrate candidates
  const candidates = await migrateCandidates(year)
  
  // Step 2: Migrate races
  await migrateRaces(year, candidates)
  
  // Step 3: Migrate endorsements (if any)
  await migrateEndorsements(year, candidates)
}

export async function migrateYearFromBranch(year: number, branch: string) {
  console.log(`\nMigrating year ${year} from branch ${branch}...`)
  
  // Determine data path based on branch
  const isRefactorBranch = branch === 'refactor'
  const dataPath = isRefactorBranch ? 'legacy/data/json' : 'data'
  
  // Step 1: Migrate candidates
  const candidates = await migrateCandidatesFromPath(year, dataPath)
  
  // Step 2: Migrate races
  await migrateRacesFromPath(year, candidates, dataPath)
  
  // Step 3: Migrate endorsements (if any)
  await migrateEndorsementsFromPath(year, candidates, dataPath)
}

async function migrateCandidates(year: number): Promise<CandidateMapping[]> {
  return migrateCandidatesFromPath(year, 'legacy/data/json')
}

async function migrateCandidatesFromPath(year: number, dataPath: string): Promise<CandidateMapping[]> {
  console.log('Migrating candidates...')
  const candidates: CandidateMapping[] = []
  
  // Find all candidate files for the year
  const candidateFiles = await glob(`${dataPath}/candidates/${year}-*.json`)
  
  for (const file of candidateFiles) {
    const data = await readJsonFile<LegacyCandidateData>(file)
    
    // Find the office
    const office = await prisma.office.findFirst({
      where: { title: data.office }
    })
    
    if (!office) {
      console.warn(`Office not found for candidate ${data.name}: ${data.office}`)
      continue
    }
    
    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        stateId: data.uuid || data.slug,
        electionYear: parseInt(data.electionyear)
      }
    })
    
    if (existingCandidate) {
      candidates.push({
        id: existingCandidate.id,
        slug: data.slug,
        pdcId: data.uuid
      })
      continue
    }
    
    // Create the candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: data.name,
        stateId: data.uuid || data.slug,
        electionYear: parseInt(data.electionyear),
        officeId: office.id,
        email: data.email || null,
        image: data.image || null,
        bio: data.fields?.bio_html || null,
        party: data.party || null,
        statement: data.statement || null,
        website: data.website || null,
        facebook: data.facebook || null,
        twitter: data.twitter || null,
        instagram: data.instagram || null,
        youtube: data.youtube || null,
        pdc: data.pdc_url || null
      }
    })
    
    candidates.push({
      id: candidate.id,
      slug: data.slug,
      pdcId: data.uuid
    })
  }
  
  return candidates
}

async function migrateRaces(year: number, candidates: CandidateMapping[]) {
  return migrateRacesFromPath(year, candidates, 'legacy/data/json')
}

async function migrateRacesFromPath(year: number, candidates: CandidateMapping[], dataPath: string) {
  console.log('Migrating races...')
  
  // Find all race files for the year
  const raceFiles = await glob(`${dataPath}/races/${year}-*.json`)
  
  for (const file of raceFiles) {
    const data = await readJsonFile<LegacyRaceData>(file)
    
    // Find the office
    const office = await prisma.office.findFirst({
      where: { title: data.office }
    })
    
    if (!office) {
      console.warn(`Office not found for race: ${data.office}`)
      continue
    }
    
    // Convert race type to enum
    const raceType = data.type.toUpperCase() as ElectionType
    
    // Check if race already exists
    const existingRace = await prisma.race.findFirst({
      where: {
        electionYear: parseInt(data.electionyear),
        officeId: office.id,
        type: raceType
      }
    })
    
    if (existingRace) {
      console.warn(`Race already exists: ${data.office} (${data.type})`)
      continue
    }
    
    // Create the race
    const race = await prisma.race.create({
      data: {
        electionYear: parseInt(data.electionyear),
        officeId: office.id,
        type: raceType,
        intro: data.intro || null,
        body: data.body || null,
        hide: data.hide || false,
        candidates: {
          create: data.candidates.map(candidateRef => {
            // Try to find candidate by PDC ID first, then by slug
            const candidate = candidates.find(c => 
              c.pdcId === candidateRef || // Match by PDC ID
              c.slug === candidateRef     // Match by slug
            )
            
            if (!candidate) {
              console.warn(`Candidate not found: ${candidateRef}`)
              return null
            }
            
            return {
              candidateId: candidate.id,
              // We'll update these later when we have results
              incumbent: false,
              shortTerm: false
            }
          }).filter((c): c is NonNullable<typeof c> => c !== null)
        }
      }
    })
  }
}

async function migrateEndorsements(year: number, candidates: CandidateMapping[]) {
  return migrateEndorsementsFromPath(year, candidates, 'legacy/data/json')
}

async function migrateEndorsementsFromPath(year: number, candidates: CandidateMapping[], dataPath: string) {
  console.log('Migrating endorsements...')
  
  // Find all endorsement files for the year
  const endorsementFiles = await glob(`${dataPath}/endorsements/${year}-*.json`)
  
  for (const file of endorsementFiles) {
    const endorsements = await readJsonFile<Record<string, any[]>>(file)
    
    for (const [candidateSlug, endorsementList] of Object.entries(endorsements)) {
      const candidate = candidates.find(c => c.slug === candidateSlug)
      if (!candidate) {
        console.warn(`Candidate not found for endorsements: ${candidateSlug}`)
        continue
      }
      
      // Create endorsements for the candidate
      for (const endorsement of endorsementList) {
        await prisma.endorsement.create({
          data: {
            candidateId: candidate.id,
            endorser: endorsement.name,
            url: endorsement.url,
            type: endorsement.type || 'ORG',
            forAgainst: endorsement.forAgainst || 'FOR'
          }
        })
      }
    }
  }
} 