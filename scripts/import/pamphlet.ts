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

// A pamphlet statement whose only content is the section headings and
// "No information submitted" is worse than none — it renders as a wall of
// nothing. Treat it as absent.
function hasSubstance(markdown: string): boolean {
  return (
    markdown
      .replace(/\*\*[^*]*\*\*/g, '')
      .replace(/no information submitted/gi, '')
      .replace(/[\s\\*_-]/g, '').length > 0
  )
}

// Create slug from name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function importPamphletData() {
  const dryRun = process.argv.includes('--dry-run')
  const electionYear = parseInt(electionConfig.year)
  console.log(
    `\n🗳️  Importing ${electionYear} ${electionConfig.type} voter pamphlet data${dryRun ? ' (dry run)' : ''}...\n`
  )

  // Seed the matcher with this election's candidates so ballot names match
  // even before they have entries in load-config-names.json
  const yearCandidates = await prisma.candidate.findMany({
    where: { electionYear },
    select: { name: true }
  })
  yearCandidates.forEach(c => nameMatcher.addKnownName(c.name, c.name))
  
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

          if (!dryRun) {
            await fs.writeFile(fullImagePath, photoBuffer)
          }
          imagePath = `/images/candidates/${imageFilename}`
          photosImported++
          console.log(`  📸 ${dryRun ? 'Would save' : 'Saved'} photo for ${normalizedName}`)
        }
        
        // Convert HTML statement to markdown
        const turndowned = item.statement.Statement
          ? markdownConverter.turndown(item.statement.Statement)
          : null
        const statementMarkdown = turndowned && hasSubstance(turndowned) ? turndowned : null

        if (statementMarkdown) {
          statementsImported++
        } else if (turndowned) {
          console.log(`  ∅ ${normalizedName} submitted no pamphlet content`)
        }

        // Only write fields the pamphlet actually changes, so a re-run shows
        // what moved rather than touching every candidate
        const updateData: Record<string, string> = {}
        const email = item.statement.OrgEmail
        if (email && email !== candidate.email) updateData.email = email
        const website = fixUrl(item.statement.OrgWebsite)
        if (website && website !== candidate.website) updateData.website = website
        if (imagePath && imagePath !== candidate.image) updateData.image = imagePath
        if (statementMarkdown && statementMarkdown !== candidate.statement) {
          updateData.statement = statementMarkdown
        }

        const changed = Object.keys(updateData)
        if (changed.length === 0) {
          console.log(`  = ${normalizedName} unchanged`)
          continue
        }

        if (!dryRun) {
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: updateData
          })
        }

        console.log(`  ✓ ${dryRun ? 'Would update' : 'Updated'} ${normalizedName}: ${changed.join(', ')}`)
      }
    } catch (error) {
      console.error(`  ❌ Error processing race ${raceId}:`, error)
    }
  }
  
  console.log(`\n✅ Pamphlet import complete!${dryRun ? ' (dry run — nothing written)' : ''}`)
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