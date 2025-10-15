/**
 * TCRC Questionnaire Loader
 *
 * Loads TCRC questionnaire participation data from CSV into the database.
 * Creates Engagement and CandidateEngagement records.
 *
 * Usage:
 *   npm run import:tcrc:load              # Dry run (CSV output only)
 *   IMPORT_MODE=db npm run import:tcrc:load   # Write to database
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - CSV file from tcrc-questionnaire.ts: scripts/import/tcrc-responses.csv
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
  participated: boolean
  notes: string
}

async function loadQuestionnaire() {
  console.log(`${EMOJI.SEARCH} Starting TCRC Questionnaire loader...\n`)

  const outputMode = getOutputMode()
  console.log(outputMode.message)
  console.log()

  const csvPath = 'scripts/import/tcrc-responses.csv'

  // Check for CSV file
  const fs = await import('fs')
  if (!fs.existsSync(csvPath)) {
    console.error(`${EMOJI.ERROR} ERROR: CSV file not found: ${csvPath}`)
    console.error('Please run: npm run import:tcrc first')
    process.exit(1)
  }

  // Read CSV
  console.log(`${EMOJI.SEARCH} Reading CSV file...`)
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').slice(1) // Skip header

  const rows: CsvRow[] = []
  let lineNum = 2 // Start at 2 (header is line 1)

  for (const line of lines) {
    if (!line.trim()) continue

    const fields = parseCsvLine(line, 4)
    if (!fields) {
      console.log(
        `${EMOJI.WARNING} Skipping malformed line ${lineNum}: ${line.substring(0, 50)}...`
      )
      lineNum++
      continue
    }

    const [candidateName, office, participatedStr, notes] = fields

    rows.push({
      candidateName,
      office,
      participated: participatedStr.toUpperCase() === 'TRUE',
      notes,
    })

    lineNum++
  }

  console.log(`${EMOJI.SUCCESS} Parsed ${rows.length} rows from CSV\n`)

  // Fetch all candidates for name matching
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

  // Process each row
  const results: string[] = []
  let imported = 0
  let skipped = 0
  let errors = 0

  // Engagement details (same for all candidates)
  const engagementTitle = 'TCRC Questionnaire 2025'
  const engagementDate = new Date('2025-08-01') // Approximate - adjust if you have exact date
  const engagementSlug = generateEngagementSlug(
    engagementTitle,
    engagementDate
  )
  const engagementPrimaryLink =
    'https://indd.adobe.com/view/publication/6ff62159-8c7f-435a-bc67-2ab6b3d56467/c17s/publication-web-resources/pdf/2025_Vote_for_Business_Primary_Candidate_Questionnaire.pdf'

  if (!isDryRun()) {
    // Create or update the Engagement record (once for all candidates)
    console.log(`${EMOJI.SEARCH} Creating/updating Engagement record...`)
    const engagement = await prisma.engagement.upsert({
      where: { slug: engagementSlug },
      create: {
        slug: engagementSlug,
        title: engagementTitle,
        date: engagementDate,
        primaryLink: engagementPrimaryLink,
        notes: 'Tri-City Regional Chamber of Commerce candidate questionnaire for the 2025 primary election',
      },
      update: {
        title: engagementTitle,
        date: engagementDate,
        primaryLink: engagementPrimaryLink,
      },
    })
    console.log(`${EMOJI.SUCCESS} Engagement record ready: ${engagement.id}\n`)
  }

  console.log(`${EMOJI.PROCESSING} Processing candidate participation...\n`)

  for (const row of rows) {
    try {
      // Case-insensitive name match
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

      // Check if already exists
      if (!isDryRun()) {
        const engagement = await prisma.engagement.findUnique({
          where: { slug: engagementSlug },
        })

        if (!engagement) {
          throw new Error('Engagement record not found')
        }

        const existing = await prisma.candidateEngagement.findUnique({
          where: {
            engagementId_candidateId: {
              engagementId: engagement.id,
              candidateId: candidate.id,
            },
          },
        })

        if (existing) {
          console.log(
            `${EMOJI.SKIP} Already exists: ${candidate.name} - updating participation status`
          )
          await prisma.candidateEngagement.update({
            where: {
              engagementId_candidateId: {
                engagementId: engagement.id,
                candidateId: candidate.id,
              },
            },
            data: {
              participated: row.participated,
              notes: row.notes || (row.participated ? 'Responded' : 'Did not respond'),
            },
          })
          results.push(
            `UPDATED,${escapeCsvField(candidate.name)},${row.participated ? 'Participated' : 'Did not participate'}`
          )
        } else {
          // Create new record
          await prisma.candidateEngagement.create({
            data: {
              engagementId: engagement.id,
              candidateId: candidate.id,
              participated: row.participated,
              notes: row.notes || (row.participated ? 'Responded' : 'Did not respond'),
            },
          })

          console.log(
            `${EMOJI.SUCCESS} Imported: ${candidate.name} (${row.participated ? 'participated' : 'did not participate'})`
          )
          results.push(
            `IMPORTED,${escapeCsvField(candidate.name)},${row.participated ? 'Participated' : 'Did not participate'}`
          )
        }

        imported++
      } else {
        // Dry run - just log what would happen
        console.log(
          `${EMOJI.INFO} Would import: ${candidate.name} (${row.participated ? 'participated' : 'did not participate'})`
        )
        results.push(
          `DRY_RUN,${escapeCsvField(candidate.name)},${row.participated ? 'Participated' : 'Did not participate'}`
        )
        imported++
      }
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

  // Save results to CSV
  const resultsCsv = [
    'Status,Candidate Name,Notes',
    ...results,
  ].join('\n')

  const resultsPath = isDryRun()
    ? 'scripts/import/tcrc-responses-dry-run-results.csv'
    : 'scripts/import/tcrc-responses-import-results.csv'

  fs.writeFileSync(resultsPath, resultsCsv)

  // Summary
  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total processed: ${rows.length}`)
  console.log(`   Imported/Updated: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${resultsPath}`)

  if (isDryRun()) {
    console.log(
      `\n${EMOJI.INFO} To write to database, run: IMPORT_MODE=db npm run import:tcrc:load`
    )
  }

  await prisma.$disconnect()
}

loadQuestionnaire().catch(console.error)
