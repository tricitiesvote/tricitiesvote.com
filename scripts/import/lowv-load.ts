/**
 * LWV Vote411 Loader
 *
 * Loads Vote411 questionnaire participation data from CSV into the database.
 * Creates/updates Engagement and CandidateEngagement records.
 *
 * Usage:
 *   npm run import:lowv:load              # Dry run (CSV output only)
 *   IMPORT_MODE=db npm run import:lowv:load   # Write to database
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - CSV file from lowv-scrape.ts: scripts/import/lowv-responses.csv
 */

import { PrismaClient } from '@prisma/client'
import {
  EMOJI,
  parseCsvLine,
  getOutputMode,
  generateEngagementSlug,
  escapeCsvField,
  isDryRun,
} from './config'

const prisma = new PrismaClient()

interface CsvRow {
  candidateName: string
  office: string
  region: string
  participated: boolean
  notes: string
  raceUrl: string
}

async function loadLowv() {
  console.log(`${EMOJI.SEARCH} Starting Vote411 loader...\n`)

  const outputMode = getOutputMode()
  console.log(outputMode.message)
  console.log()

  const csvPath = 'scripts/import/lowv-responses.csv'

  const fs = await import('fs')
  if (!fs.existsSync(csvPath)) {
    console.error(`${EMOJI.ERROR} ERROR: CSV file not found: ${csvPath}`)
    console.error('Please run: npm run import:lowv first')
    process.exit(1)
  }

  console.log(`${EMOJI.SEARCH} Reading CSV file...`)
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').slice(1) // Skip header

  const rows: CsvRow[] = []
  let lineNum = 2

  for (const line of lines) {
    if (!line.trim()) continue

    const fields = parseCsvLine(line, 6)
    if (!fields) {
      console.log(
        `${EMOJI.WARNING} Skipping malformed line ${lineNum}: ${line.substring(0, 80)}...`
      )
      lineNum++
      continue
    }

    const [candidateName, office, region, participatedStr, notes, raceUrl] = fields

    rows.push({
      candidateName,
      office,
      region,
      participated: participatedStr.toUpperCase() === 'TRUE',
      notes,
      raceUrl,
    })

    lineNum++
  }

  console.log(`${EMOJI.SUCCESS} Parsed ${rows.length} rows from CSV\n`)

  console.log(`${EMOJI.SEARCH} Fetching candidates from database...`)
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
    },
    include: {
      office: true,
    },
  })

  console.log(`${EMOJI.SUCCESS} Found ${candidates.length} candidates\n`)

  const engagementTitle = 'LWV Vote411 Questionnaire 2025'
  const engagementDate = new Date('2025-08-01')
  const engagementSlug = generateEngagementSlug(engagementTitle, engagementDate)
  const engagementPrimaryLink = 'https://www.vote411.org/ballot'

  if (!isDryRun()) {
    console.log(`${EMOJI.SEARCH} Creating/updating Engagement record...`)
    await prisma.engagement.upsert({
      where: { slug: engagementSlug },
      create: {
        slug: engagementSlug,
        title: engagementTitle,
        date: engagementDate,
        primaryLink: engagementPrimaryLink,
        notes: 'League of Women Voters Vote411 questionnaire responses for 2025 general election',
      },
      update: {
        title: engagementTitle,
        date: engagementDate,
        primaryLink: engagementPrimaryLink,
      },
    })
    console.log(`${EMOJI.SUCCESS} Engagement record ready\n`)
  }

  const results: string[] = []
  let imported = 0
  let skipped = 0
  let errors = 0

  console.log(`${EMOJI.PROCESSING} Processing candidate participation...\n`)

  for (const row of rows) {
    try {
      const candidate = candidates.find(
        c => c.name.toLowerCase() === row.candidateName.toLowerCase()
      )

      if (!candidate) {
        console.log(
          `${EMOJI.WARNING} No match found for "${row.candidateName}" - skipping`
        )
        results.push(
          `SKIPPED,${escapeCsvField(row.candidateName)},No matching candidate in database`
        )
        skipped++
        continue
      }

      if (!isDryRun()) {
        const engagement = await prisma.engagement.findUnique({
          where: { slug: engagementSlug },
        })

        if (!engagement) {
          throw new Error('Engagement record not found')
        }

        await prisma.candidateEngagement.upsert({
          where: {
            engagementId_candidateId: {
              engagementId: engagement.id,
              candidateId: candidate.id,
            },
          },
          create: {
            engagementId: engagement.id,
            candidateId: candidate.id,
            participated: row.participated,
            notes: row.notes || (row.participated ? 'Provided responses on Vote411' : 'No Vote411 responses'),
            link: row.raceUrl || engagementPrimaryLink,
          },
          update: {
            participated: row.participated,
            notes: row.notes || (row.participated ? 'Provided responses on Vote411' : 'No Vote411 responses'),
            link: row.raceUrl || engagementPrimaryLink,
          },
        })

        console.log(
          `${EMOJI.SUCCESS} Processed: ${candidate.name} (${row.participated ? 'participated' : 'did not participate'})`
        )
        results.push(
          `IMPORTED,${escapeCsvField(candidate.name)},${row.participated ? 'Participated' : 'Did not participate'}`
        )
      } else {
        console.log(
          `${EMOJI.INFO} Would import: ${candidate.name} (${row.participated ? 'participated' : 'did not participate'})`
        )
        results.push(
          `DRY_RUN,${escapeCsvField(candidate.name)},${row.participated ? 'Participated' : 'Did not participate'}`
        )
      }

      imported++
    } catch (error) {
      console.error(
        `${EMOJI.ERROR} Error processing ${row.candidateName}:`,
        error
      )
      results.push(
        `ERROR,${escapeCsvField(row.candidateName)},${error instanceof Error ? error.message : 'Unknown error'}`
      )
      errors++
    }
  }

  const resultsCsv = [
    'Status,Candidate Name,Notes',
    ...results,
  ].join('\n')

  const resultsPath = isDryRun()
    ? 'scripts/import/lowv-responses-dry-run-results.csv'
    : 'scripts/import/lowv-responses-import-results.csv'

  fs.writeFileSync(resultsPath, resultsCsv)

  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total processed: ${rows.length}`)
  console.log(`   Imported/Updated: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${resultsPath}`)

  if (isDryRun()) {
    console.log(
      `\n${EMOJI.INFO} To write to database, run: IMPORT_MODE=db npm run import:lowv:load`
    )
  }

  await prisma.$disconnect()
}

loadLowv().catch(async error => {
  console.error(`${EMOJI.ERROR} Vote411 loader failed`, error)
  await prisma.$disconnect()
  process.exit(1)
})

