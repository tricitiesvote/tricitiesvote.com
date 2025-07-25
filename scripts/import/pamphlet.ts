#!/usr/bin/env node
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'
import TurndownService from 'turndown'
import { NameMatcher } from '../../lib/normalize/names'
import namesConfig from '../../legacy/data/json/load-config-names.json'
import electionConfig from '../../legacy/data/json/load-config-election.json'

const prisma = new PrismaClient()
const markdownConverter = new TurndownService()
const nameMatcher = new NameMatcher()

// Load name mappings from config
namesConfig.forEach((entry: any) => {
  nameMatcher.addKnownName(entry.formattedName, entry.formattedName)
  entry.altNames?.forEach((altName: string) => {
    nameMatcher.addAlias(entry.formattedName, altName)
  })
})

interface PamphletStatement {
  BallotID: string
  BallotName: string
  OrgEmail: string
  OrgWebsite: string
  Statement: string
  Photo?: string
}

interface PamphletData {
  statement: PamphletStatement
}

// Fix URL formatting
function fixUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (!/^(?:f|ht)tps?:\/\//.test(url)) {
    return `http://${url}`
  }
  return url
}

// Create slug from name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function importPamphletData() {
  const electionYear = parseInt(electionConfig.year)
  console.log(`\n🗳️  Importing ${electionYear} voter pamphlet data...\n`)
  
  const electionId = electionConfig.electionId
  const raceIds = electionConfig.raceIds
  
  const apiUrl = 'https://voter.votewa.gov/elections/candidate.ashx'
  const imageDir = path.join(process.cwd(), 'public/images/candidates')
  
  // Ensure image directory exists
  await fs.mkdir(imageDir, { recursive: true })
  
  let totalCandidates = 0
  let photosImported = 0
  let statementsImported = 0
  
  // Fetch data for each race
  for (const raceId of raceIds) {
    console.log(`Fetching race ${raceId}...`)
    
    try {
      const url = `${apiUrl}?e=${electionId}&r=${raceId}&la=&c=`
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn(`  ⚠️  Failed to fetch race ${raceId}: ${response.statusText}`)
        continue
      }
      
      const data = await response.json() as PamphletData[]
      
      for (const item of data) {
        const rawName = item.statement.BallotName
        const nameMatch = nameMatcher.findMatch(rawName)
        
        if (nameMatch.source === 'none') {
          console.warn(`  ❌ Could not match name: ${rawName}`)
          continue
        }
        
        const normalizedName = nameMatch.normalizedName
        totalCandidates++
        
        // Find the candidate in our database
        const candidate = await prisma.candidate.findFirst({
          where: {
            name: normalizedName,
            electionYear: electionYear
          }
        })
        
        if (!candidate) {
          console.warn(`  ⚠️  Candidate not found in database: ${normalizedName}`)
          continue
        }
        
        // Process and save photo if present
        let imagePath: string | null = null
        if (item.statement.Photo) {
          const filename = slugify(normalizedName)
          const photoBuffer = Buffer.from(item.statement.Photo, 'base64')
          const imageFilename = `${filename}-original.png`
          const fullImagePath = path.join(imageDir, imageFilename)
          
          await fs.writeFile(fullImagePath, photoBuffer)
          imagePath = `/images/candidates/${imageFilename}`
          photosImported++
          console.log(`  📸 Saved photo for ${normalizedName}`)
        }
        
        // Convert HTML statement to markdown
        const statementMarkdown = item.statement.Statement 
          ? markdownConverter.turndown(item.statement.Statement)
          : null
        
        if (statementMarkdown) {
          statementsImported++
        }
        
        // Update candidate with pamphlet data
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            email: item.statement.OrgEmail || candidate.email,
            website: fixUrl(item.statement.OrgWebsite) || candidate.website,
            image: imagePath || candidate.image,
            statement: statementMarkdown || candidate.statement
          }
        })
        
        console.log(`  ✓ Updated ${normalizedName}`)
      }
    } catch (error) {
      console.error(`  ❌ Error processing race ${raceId}:`, error)
    }
  }
  
  console.log('\n✅ Pamphlet import complete!')
  console.log(`   Total candidates processed: ${totalCandidates}`)
  console.log(`   Photos imported: ${photosImported}`)
  console.log(`   Statements imported: ${statementsImported}`)
}

// Run the import
importPamphletData()
  .catch(error => {
    console.error('Import failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })