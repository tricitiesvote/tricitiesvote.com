#!/usr/bin/env ts-node
// Import historical data from year branches (2020-2023)
// This includes photos, endorsements, articles, questionnaires, etc.

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'

const prisma = new PrismaClient()

interface HistoricalCandidate {
  name: string
  slug: string
  electionyear: string
  office: string
  email?: string
  website?: string
  facebook?: string
  twitter?: string
  instagram?: string
  youtube?: string
  image?: string
  pdc_url?: string
  pamphlet_url?: string
  statement?: string
  bio?: string
  engagement?: string
  articles?: any[]
  uuid?: string
  party?: string
}

interface HistoricalEndorsement {
  candidate: string      // This is actually a candidate ID like "LOHRJ--336"
  endorser: string
  forAgainst: 'for' | 'against'
  type?: string
  url?: string
}

// Add a map to track uuid -> database candidate ID
const candidateIdMap = new Map<string, string>()

async function checkoutBranch(year: number) {
  console.log(`Checking out branch ${year}...`)
  execSync(`git checkout origin/${year} -- data/`, { stdio: 'inherit' })
}

async function loadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(`Could not load ${filePath}:`, error)
    return null
  }
}

async function importYearData(year: number) {
  console.log(`\n=== Importing data for ${year} ===`)
  
  // Checkout the year branch data
  await checkoutBranch(year)
  
  // Import candidates with all their rich data
  const candidatesDir = path.join('data', 'candidates')
  try {
    const files = await fs.readdir(candidatesDir)
    const candidateFiles = files.filter(f => f.startsWith(`${year}-`) && f.endsWith('.json'))
    
    for (const file of candidateFiles) {
      const candidate = await loadJsonFile<HistoricalCandidate>(path.join(candidatesDir, file))
      if (candidate) {
        await updateCandidateWithHistoricalData(candidate, year)
      }
    }
    console.log(`Imported ${candidateFiles.length} candidates`)
  } catch (error) {
    console.warn(`No candidate data for ${year}`)
  }
  
  // Import endorsements
  const endorsementsDir = path.join('data', 'endorsements')
  try {
    const files = await fs.readdir(endorsementsDir)
    let endorsementCount = 0
    
    for (const file of files) {
      const endorsement = await loadJsonFile<HistoricalEndorsement>(path.join(endorsementsDir, file))
      if (endorsement && endorsement.electionyear === year.toString()) {
        await importEndorsement(endorsement, year)
        endorsementCount++
      }
    }
    console.log(`Imported ${endorsementCount} endorsements`)
  } catch (error) {
    console.warn(`No endorsement data for ${year}`)
  }
  
  // Import questionnaire responses
  const questionnairesDir = path.join('data', 'questionnaires')
  try {
    // Check for CSV files with candidate responses
    const files = await fs.readdir(questionnairesDir)
    const responseFiles = files.filter(f => f.includes('answers'))
    
    for (const file of responseFiles) {
      console.log(`Found questionnaire responses: ${file}`)
      // TODO: Parse CSV and update candidate records
    }
  } catch (error) {
    console.warn(`No questionnaire data for ${year}`)
  }
  
  // Copy image files
  const imagesDir = path.join('static', 'images', 'candidates')
  const targetDir = path.join('public', 'images', 'candidates', year.toString())
  
  try {
    await fs.mkdir(targetDir, { recursive: true })
    const files = await fs.readdir(imagesDir)
    const imageFiles = files.filter(f => f.startsWith(`${year}-`))
    
    for (const file of imageFiles) {
      await fs.copyFile(
        path.join(imagesDir, file),
        path.join(targetDir, file)
      )
    }
    console.log(`Copied ${imageFiles.length} candidate images`)
  } catch (error) {
    console.warn(`No image data for ${year}`)
  }
}

async function updateCandidateWithHistoricalData(historical: HistoricalCandidate, year: number) {
  // Find the candidate in our database
  const candidate = await prisma.candidate.findFirst({
    where: {
      name: historical.name,
      electionYear: year
    }
  })
  
  if (!candidate) {
    console.warn(`Candidate not found in DB: ${historical.name} (${year})`)
    return
  }
  
  // Update with all the rich historical data
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      email: historical.email || candidate.email,
      website: historical.website || candidate.website,
      facebook: historical.facebook || candidate.facebook,
      twitter: historical.twitter || candidate.twitter,
      instagram: historical.instagram || candidate.instagram,
      youtube: historical.youtube || candidate.youtube,
      image: historical.image ? `/images/candidates/${year}/${historical.image}` : candidate.image,
      statement: historical.statement || candidate.statement,
      bio: historical.bio || candidate.bio,
      engagement: historical.engagement || candidate.engagement,
      articles: historical.articles ? JSON.stringify(historical.articles) : candidate.articles,
      party: historical.party || candidate.party
    }
  })
}

async function importEndorsement(endorsement: HistoricalEndorsement, year: number) {
  const candidate = await prisma.candidate.findFirst({
    where: {
      name: endorsement.candidate,
      electionYear: year
    }
  })
  
  if (!candidate) {
    console.warn(`Candidate not found for endorsement: ${endorsement.candidate}`)
    return
  }
  
  await prisma.endorsement.create({
    data: {
      candidateId: candidate.id,
      endorser: endorsement.endorser,
      url: endorsement.url || '',
      type: 'ORG', // Default, could be parsed from endorser name
      forAgainst: endorsement.endorsed ? 'FOR' : 'AGAINST'
    }
  })
}

async function main() {
  const years = [2020, 2021, 2022, 2023]
  
  try {
    // Save current branch
    const currentBranch = execSync('git branch --show-current').toString().trim()
    
    for (const year of years) {
      await importYearData(year)
    }
    
    // Clean up - remove the checked out data directory
    execSync('rm -rf data/', { stdio: 'inherit' })
    
    // Restore git state
    execSync('git checkout .', { stdio: 'inherit' })
    
    console.log('\n=== Historical data import completed ===')
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}