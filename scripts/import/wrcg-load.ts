/**
 * WRCG Questionnaire Loader
 *
 * Loads WRCG questionnaire participation data from CSV into the database.
 * Creates Engagement and CandidateEngagement records for West Richland candidates.
 *
 * Usage:
 *   npm run import:wrcg:load              # Dry run (CSV output only)
 *   IMPORT_MODE=db npm run import:wrcg:load   # Write to database
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - CSV file from wrcg-scrape.ts: scripts/import/wrcg-responses.csv
 */

import { PrismaClient } from '@prisma/client'
import {
  EMOJI,
  parseCsvLine,
  parseCsvFile,
  getOutputMode,
  generateEngagementSlug,
  escapeCsvField,
  isDryRun,
} from './config'

const prisma = new PrismaClient()

interface CsvRow {
  candidateName: string
  url: string
  hasQuestionnaire: boolean
  questionnaireText?: string
  notes?: string
}

async function loadWrcg() {
  console.log(`${EMOJI.SEARCH} Starting WRCG Questionnaire loader...\n`)

  const outputMode = getOutputMode()
  console.log(outputMode.message)
  console.log()

  const csvPath = 'scripts/import/wrcg-responses.csv'

  // Check for CSV file
  const fs = await import('fs')
  if (!fs.existsSync(csvPath)) {
    console.error(`${EMOJI.ERROR} ERROR: CSV file not found: ${csvPath}`)
    console.error('Please run: npm run import:wrcg first')
    process.exit(1)
  }

  // Read CSV with proper multi-line handling
  console.log(`${EMOJI.SEARCH} Reading CSV file...`)
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = parseCsvFile(csvContent)

  const rows: CsvRow[] = []

  // Skip header and parse rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const fields = parseCsvLine(line, 5)
    if (!fields) {
      console.log(
        `${EMOJI.WARNING} Skipping malformed line ${i + 1}: ${line.substring(0, 50)}...`
      )
      continue
    }

    const [candidateName, url, hasQuestionnaireStr, questionnaireText, notes] = fields

    rows.push({
      candidateName,
      url,
      hasQuestionnaire: hasQuestionnaireStr.toUpperCase() === 'TRUE',
      questionnaireText: questionnaireText || undefined,
      notes: notes || undefined,
    })
  }

  console.log(`${EMOJI.SUCCESS} Parsed ${rows.length} rows from CSV\n`)

  // Fetch West Richland candidates
  console.log(`${EMOJI.SEARCH} Fetching West Richland candidates from database...`)
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      office: {
        region: {
          name: { contains: 'West Richland', mode: 'insensitive' },
        },
      },
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
  const engagementTitle = 'WRCG Candidate Questionnaire 2025'
  const engagementDate = new Date('2025-08-01') // Approximate - adjust if you have exact date
  const engagementSlug = generateEngagementSlug(
    engagementTitle,
    engagementDate
  )
  const engagementPrimaryLink = 'https://www.wrcg.org/2025-elections'

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
        notes: 'West Richland Citizens Group candidate questionnaire for 2025 election',
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

      if (!isDryRun()) {
        const engagement = await prisma.engagement.findUnique({
          where: { slug: engagementSlug },
        })

        if (!engagement) {
          throw new Error('Engagement record not found')
        }

        // Check if already exists
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
              participated: row.hasQuestionnaire,
              notes: row.hasQuestionnaire
                ? `Completed WRCG questionnaire - ${row.url}`
                : row.notes || 'Did not complete questionnaire',
              link: row.url || engagementPrimaryLink,
            },
          })
          results.push(
            `UPDATED,${escapeCsvField(candidate.name)},${row.hasQuestionnaire ? 'Participated' : 'Did not participate'}`
          )
        } else {
          // Create new record
          await prisma.candidateEngagement.create({
            data: {
              engagementId: engagement.id,
              candidateId: candidate.id,
              participated: row.hasQuestionnaire,
              notes: row.hasQuestionnaire
                ? `Completed WRCG questionnaire - ${row.url}`
                : row.notes || 'Did not complete questionnaire',
              link: row.url || engagementPrimaryLink,
            },
          })

          console.log(
            `${EMOJI.SUCCESS} Imported: ${candidate.name} (${row.hasQuestionnaire ? 'participated' : 'did not participate'})`
          )
          results.push(
            `IMPORTED,${escapeCsvField(candidate.name)},${row.hasQuestionnaire ? 'Participated' : 'Did not participate'}`
          )
        }

        imported++
      } else {
        // Dry run - just log what would happen
        console.log(
          `${EMOJI.INFO} Would import: ${candidate.name} (${row.hasQuestionnaire ? 'participated' : 'did not participate'})`
        )
        results.push(
          `DRY_RUN,${escapeCsvField(candidate.name)},${row.hasQuestionnaire ? 'Participated' : 'Did not participate'}`
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
    ? 'scripts/import/wrcg-responses-dry-run-results.csv'
    : 'scripts/import/wrcg-responses-import-results.csv'

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
      `\n${EMOJI.INFO} To write to database, run: IMPORT_MODE=db npm run import:wrcg:load`
    )
  }

  await prisma.$disconnect()
}

loadWrcg().catch(console.error)
