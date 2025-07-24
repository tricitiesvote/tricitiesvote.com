#!/usr/bin/env ts-node
// SAFE VERSION: Import historical data with validation and dry-run mode

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as readline from 'readline'

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
  candidate: string      // Candidate ID like "LOHRJ--336"
  endorser: string
  forAgainst: 'for' | 'against'
  type?: string
  url?: string
}

// Track mappings and stats
const stats = {
  candidatesFound: 0,
  candidatesMatched: 0,
  candidatesMissing: [] as string[],
  endorsementsFound: 0,
  endorsementsMatched: 0,
  endorsementsMissing: [] as string[],
  imagesFound: 0,
  imagesCopied: 0,
  questionnairesFound: 0,
  questionnairesCopied: 0
}

// Map UUID to database candidate ID for endorsement matching
const uuidToCandidateId = new Map<string, string>()

async function checkoutBranch(year: number, dryRun: boolean) {
  if (dryRun) {
    console.log(`[DRY RUN] Would checkout branch ${year}`)
    return
  }
  
  console.log(`Checking out data from branch ${year}...`)
  try {
    execSync(`git checkout origin/${year} -- data/`, { stdio: 'pipe' })
    
    // Also try to get static/images if it exists
    try {
      execSync(`git checkout origin/${year} -- static/images/candidates/`, { stdio: 'pipe' })
    } catch (e) {
      console.log('No static/images directory in this branch')
    }
  } catch (error) {
    console.error(`Failed to checkout branch ${year}:`, error)
    throw error
  }
}

async function loadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
}

async function analyzeYearData(year: number) {
  console.log(`\n=== Analyzing data for ${year} ===`)
  
  // Reset stats
  Object.assign(stats, {
    candidatesFound: 0,
    candidatesMatched: 0,
    candidatesMissing: [],
    endorsementsFound: 0,
    endorsementsMatched: 0,
    endorsementsMissing: [],
    imagesFound: 0,
    imagesCopied: 0
  })
  
  // Analyze candidates
  const candidatesDir = path.join('data', 'candidates')
  try {
    const files = await fs.readdir(candidatesDir)
    const candidateFiles = files.filter(f => f.startsWith(`${year}-`) && f.endsWith('.json'))
    
    for (const file of candidateFiles) {
      const historical = await loadJsonFile<HistoricalCandidate>(path.join(candidatesDir, file))
      if (historical) {
        stats.candidatesFound++
        
        // Try to find in database
        const dbCandidate = await prisma.candidate.findFirst({
          where: {
            name: historical.name,
            electionYear: year
          }
        })
        
        if (dbCandidate) {
          stats.candidatesMatched++
          console.log(`✓ Found: ${historical.name} (${historical.office})`)
          
          // Store UUID to candidate ID mapping for endorsements
          if (historical.uuid) {
            uuidToCandidateId.set(historical.uuid, dbCandidate.id)
          }
        } else {
          stats.candidatesMissing.push(`${historical.name} (${historical.office})`)
          console.log(`✗ Missing: ${historical.name} (${historical.office})`)
        }
      }
    }
  } catch (error) {
    console.log('No candidate data directory')
  }
  
  // Analyze endorsements
  const endorsementsDir = path.join('data', 'endorsements')
  try {
    const files = await fs.readdir(endorsementsDir)
    
    for (const file of files) {
      if (!file.endsWith('.json') || file === 'endorsements.json') continue
      
      const endorsement = await loadJsonFile<HistoricalEndorsement>(path.join(endorsementsDir, file))
      if (endorsement) {
        stats.endorsementsFound++
        
        // Check if we can map this endorsement to a candidate
        const candidateId = uuidToCandidateId.get(endorsement.candidate)
        
        if (candidateId) {
          stats.endorsementsMatched++
          console.log(`✓ Endorsement: ${endorsement.endorser} ${endorsement.forAgainst} candidate`)
        } else {
          stats.endorsementsMissing.push(`${endorsement.endorser} ${endorsement.forAgainst} ID:${endorsement.candidate}`)
        }
      }
    }
  } catch (error) {
    console.log('No endorsement data directory')
  }
  
  // Check for questionnaires
  const questionnairesDir = path.join('data', 'questionnaires')
  try {
    const files = await fs.readdir(questionnairesDir)
    const csvFiles = files.filter(f => f.endsWith('.csv'))
    stats.questionnairesFound = csvFiles.length
    console.log(`Found ${stats.questionnairesFound} questionnaire files: ${csvFiles.join(', ')}`)
  } catch (error) {
    console.log('No questionnaire data directory')
  }
  
  // Check for images
  const imagesDir = path.join('static', 'images', 'candidates')
  try {
    const files = await fs.readdir(imagesDir)
    stats.imagesFound = files.length
    console.log(`Found ${stats.imagesFound} candidate images`)
  } catch (error) {
    console.log('No images directory')
  }
  
  return stats
}

async function importYearData(year: number, dryRun: boolean) {
  console.log(`\n=== ${dryRun ? '[DRY RUN] Would import' : 'Importing'} data for ${year} ===`)
  
  // Import candidates
  const candidatesDir = path.join('data', 'candidates')
  try {
    const files = await fs.readdir(candidatesDir)
    const candidateFiles = files.filter(f => f.startsWith(`${year}-`) && f.endsWith('.json'))
    
    for (const file of candidateFiles) {
      const historical = await loadJsonFile<HistoricalCandidate>(path.join(candidatesDir, file))
      if (historical) {
        await updateCandidateWithHistoricalData(historical, year, dryRun)
      }
    }
  } catch (error) {
    console.warn(`No candidate data for ${year}`)
  }
  
  // Import endorsements
  const endorsementsDir = path.join('data', 'endorsements')
  try {
    const files = await fs.readdir(endorsementsDir)
    let endorsementCount = 0
    
    for (const file of files) {
      if (!file.endsWith('.json') || file === 'endorsements.json') continue
      
      const endorsement = await loadJsonFile<HistoricalEndorsement>(path.join(endorsementsDir, file))
      if (endorsement) {
        const candidateId = uuidToCandidateId.get(endorsement.candidate)
        
        if (candidateId) {
          if (dryRun) {
            console.log(`[DRY RUN] Would import endorsement: ${endorsement.endorser} ${endorsement.forAgainst} candidate`)
          } else {
            await importEndorsement(endorsement, candidateId)
            endorsementCount++
          }
        }
      }
    }
    
    if (!dryRun) {
      console.log(`Imported ${endorsementCount} endorsements`)
    }
  } catch (error) {
    console.warn(`No endorsement data for ${year}`)
  }
  
  // Collect questionnaires
  const questionnairesDir = path.join('data', 'questionnaires')
  const questTargetDir = path.join('data', 'questionnaires-collected', year.toString())
  
  try {
    const files = await fs.readdir(questionnairesDir)
    const csvFiles = files.filter(f => f.endsWith('.csv'))
    
    if (csvFiles.length > 0) {
      if (!dryRun) {
        await fs.mkdir(questTargetDir, { recursive: true })
      }
      
      for (const file of csvFiles) {
        if (dryRun) {
          console.log(`[DRY RUN] Would collect questionnaire: ${file}`)
        } else {
          await fs.copyFile(
            path.join(questionnairesDir, file),
            path.join(questTargetDir, file)
          )
        }
      }
      
      if (!dryRun) {
        console.log(`Collected ${csvFiles.length} questionnaire files to ${questTargetDir}`)
      }
    }
  } catch (error) {
    console.log('No questionnaires to collect')
  }
  
  // Handle images
  const imagesDir = path.join('static', 'images', 'candidates')
  const targetDir = path.join('public', 'images', 'candidates')
  
  try {
    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true })
    }
    
    const files = await fs.readdir(imagesDir)
    for (const file of files) {
      if (dryRun) {
        console.log(`[DRY RUN] Would copy image: ${file}`)
      } else {
        await fs.copyFile(
          path.join(imagesDir, file),
          path.join(targetDir, file)
        )
      }
    }
  } catch (error) {
    console.log('No images to copy')
  }
}

async function updateCandidateWithHistoricalData(historical: HistoricalCandidate, year: number, dryRun: boolean) {
  const candidate = await prisma.candidate.findFirst({
    where: {
      name: historical.name,
      electionYear: year
    }
  })
  
  if (!candidate) {
    console.warn(`Skipping ${historical.name} - not in database`)
    return
  }
  
  const updates = {
    email: historical.email || candidate.email,
    website: historical.website || candidate.website,
    facebook: historical.facebook || candidate.facebook,
    twitter: historical.twitter || candidate.twitter,
    instagram: historical.instagram || candidate.instagram,
    youtube: historical.youtube || candidate.youtube,
    image: historical.image || candidate.image,
    statement: historical.statement || candidate.statement,
    bio: historical.bio || candidate.bio,
    engagement: historical.engagement || candidate.engagement,
    articles: historical.articles ? JSON.stringify(historical.articles) : candidate.articles,
    party: historical.party || candidate.party
  }
  
  if (dryRun) {
    console.log(`[DRY RUN] Would update ${historical.name} with:`)
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== (candidate as any)[key]) {
        console.log(`  ${key}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`)
      }
    })
  } else {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: updates
    })
    console.log(`Updated ${historical.name}`)
  }
}

async function importEndorsement(endorsement: HistoricalEndorsement, candidateId: string) {
  // Check if endorsement already exists
  const existing = await prisma.endorsement.findFirst({
    where: {
      candidateId: candidateId,
      endorser: endorsement.endorser
    }
  })
  
  if (!existing) {
    await prisma.endorsement.create({
      data: {
        candidateId: candidateId,
        endorser: endorsement.endorser,
        url: endorsement.url || '',
        type: endorsement.type === 'org' ? 'ORG' : 'LETTER',
        forAgainst: endorsement.forAgainst === 'for' ? 'FOR' : 'AGAINST'
      }
    })
  }
}

async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const years = args.filter(arg => !arg.startsWith('--')).map(y => parseInt(y))
  
  if (years.length === 0) {
    console.log('Usage: npm run import:historical [--dry-run] <year1> [year2] ...')
    console.log('Example: npm run import:historical --dry-run 2021')
    console.log('Example: npm run import:historical 2020 2021 2022 2023')
    process.exit(1)
  }
  
  try {
    // Save current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    console.log(`Current branch: ${currentBranch}`)
    
    // Ensure clean working directory
    const gitStatus = execSync('git status --porcelain').toString()
    if (gitStatus && !dryRun) {
      console.error('Working directory is not clean. Please commit or stash changes first.')
      process.exit(1)
    }
    
    for (const year of years) {
      // Checkout and analyze
      await checkoutBranch(year, dryRun)
      const stats = await analyzeYearData(year)
      
      // Show summary
      console.log(`\n--- Summary for ${year} ---`)
      console.log(`Candidates: ${stats.candidatesMatched}/${stats.candidatesFound} matched`)
      if (stats.candidatesMissing.length > 0) {
        console.log(`Missing candidates: ${stats.candidatesMissing.join(', ')}`)
      }
      console.log(`Endorsements: ${stats.endorsementsMatched}/${stats.endorsementsFound} can be imported`)
      console.log(`Images: ${stats.imagesFound} found`)
      console.log(`Questionnaires: ${stats.questionnairesFound} CSV files found`)
      
      if (!dryRun && stats.candidatesMatched > 0) {
        const proceed = await promptUser('\nProceed with import? (y/n) ')
        if (proceed) {
          await importYearData(year, false)
        }
      } else if (dryRun) {
        await importYearData(year, true)
      }
      
      // Clean up checked out files
      if (!dryRun) {
        execSync('rm -rf data/ static/', { stdio: 'pipe' })
      }
    }
    
    console.log('\n=== Import completed ===')
  } catch (error) {
    console.error('Import failed:', error)
    // Clean up
    try {
      execSync('rm -rf data/ static/', { stdio: 'pipe' })
      execSync('git checkout .', { stdio: 'pipe' })
    } catch (e) {}
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}