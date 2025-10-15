/**
 * Ballotpedia Loader
 *
 * Loads Ballotpedia data from CSV into the database.
 * - Updates candidate bio/website/email ONLY if currently NULL
 * - Skips updates if wiki overrides exist
 * - Creates Engagement records for completed surveys
 *
 * Usage:
 *   npm run import:ballotpedia:load              # Dry run (CSV output only)
 *   IMPORT_MODE=db npm run import:ballotpedia:load   # Write to database
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - CSV file from ballotpedia-scrape.ts: scripts/import/ballotpedia-data.csv
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
  url: string
  surveyCompleted: boolean
  bio?: string
  website?: string
  email?: string
  notes?: string
}

async function loadBallotpedia() {
  console.log(`${EMOJI.SEARCH} Starting Ballotpedia loader...\n`)

  const outputMode = getOutputMode()
  console.log(outputMode.message)
  console.log()

  const csvPath = 'scripts/import/ballotpedia-data.csv'

  // Check for CSV file
  const fs = await import('fs')
  if (!fs.existsSync(csvPath)) {
    console.error(`${EMOJI.ERROR} ERROR: CSV file not found: ${csvPath}`)
    console.error('Please run: npm run import:ballotpedia first')
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

    const fields = parseCsvLine(line, 9)
    if (!fields) {
      console.log(
        `${EMOJI.WARNING} Skipping malformed line ${lineNum}: ${line.substring(0, 50)}...`
      )
      lineNum++
      continue
    }

    const [
      candidateName,
      office,
      region,
      url,
      surveyCompletedStr,
      bio,
      website,
      email,
      notes,
    ] = fields

    rows.push({
      candidateName,
      office,
      region,
      url,
      surveyCompleted: surveyCompletedStr.toUpperCase() === 'TRUE',
      bio: bio || undefined,
      website: website || undefined,
      email: email || undefined,
      notes: notes || undefined,
    })

    lineNum++
  }

  console.log(`${EMOJI.SUCCESS} Parsed ${rows.length} rows from CSV\n`)

  // Fetch all candidates
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
  let updated = 0
  let skipped = 0
  let errors = 0
  let engagementsCreated = 0

  // Engagement details for survey completion
  const engagementTitle = 'Ballotpedia Survey 2025'
  const engagementSlug = generateEngagementSlug(engagementTitle, new Date('2025-08-01'))

  if (!isDryRun()) {
    // Create or update the Engagement record (once for all candidates)
    console.log(`${EMOJI.SEARCH} Creating/updating Ballotpedia Survey engagement...`)
    await prisma.engagement.upsert({
      where: { slug: engagementSlug },
      create: {
        slug: engagementSlug,
        title: engagementTitle,
        date: new Date('2025-08-01'),
        primaryLink: 'https://ballotpedia.org',
        notes: 'Ballotpedia candidate survey for 2025 elections',
      },
      update: {
        title: engagementTitle,
        primaryLink: 'https://ballotpedia.org',
      },
    })
    console.log(`${EMOJI.SUCCESS} Engagement record ready\n`)
  }

  console.log(`${EMOJI.PROCESSING} Processing candidate data...\n`)

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

      const updates: any = {}
      const updateActions: string[] = []

      // Only update fields if they are currently NULL and no wiki override exists
      if (row.bio && !candidate.bio && !candidate.bioWiki) {
        updates.bio = row.bio
        updateActions.push('bio')
      }

      if (row.website && !candidate.website && !candidate.websiteWiki) {
        updates.website = row.website
        updateActions.push('website')
      }

      if (row.email && !candidate.email && !candidate.emailWiki) {
        updates.email = row.email
        updateActions.push('email')
      }

      // Update candidate if we have changes
      if (!isDryRun() && Object.keys(updates).length > 0) {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: updates,
        })

        console.log(
          `${EMOJI.SUCCESS} Updated ${candidate.name}: ${updateActions.join(', ')}`
        )
        updated++
      } else if (isDryRun() && Object.keys(updates).length > 0) {
        console.log(
          `${EMOJI.INFO} Would update ${candidate.name}: ${updateActions.join(', ')}`
        )
        updated++
      } else {
        console.log(
          `${EMOJI.SKIP} No updates needed for ${candidate.name} (fields already populated or wiki overrides exist)`
        )
        skipped++
      }

      // Handle survey completion engagement
      if (row.surveyCompleted) {
        if (!isDryRun()) {
          const engagement = await prisma.engagement.findUnique({
            where: { slug: engagementSlug },
          })

          if (!engagement) {
            throw new Error('Engagement record not found')
          }

          // Upsert candidate engagement
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
              participated: true,
              notes: `Completed Ballotpedia survey - ${row.url}`,
            },
            update: {
              participated: true,
              notes: `Completed Ballotpedia survey - ${row.url}`,
            },
          })

          engagementsCreated++
        } else {
          console.log(
            `${EMOJI.INFO} Would create survey engagement for ${candidate.name}`
          )
          engagementsCreated++
        }
      }

      results.push(
        `${isDryRun() ? 'DRY_RUN' : 'PROCESSED'},${escapeCsvField(candidate.name)},${updateActions.length > 0 ? updateActions.join('; ') : 'No updates needed'}`
      )
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
  const resultsCsv = ['Status,Candidate Name,Notes', ...results].join('\n')

  const resultsPath = isDryRun()
    ? 'scripts/import/ballotpedia-import-dry-run-results.csv'
    : 'scripts/import/ballotpedia-import-results.csv'

  fs.writeFileSync(resultsPath, resultsCsv)

  // Summary
  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total processed: ${rows.length}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Survey engagements created: ${engagementsCreated}`)
  console.log(`   Errors: ${errors}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${resultsPath}`)

  if (isDryRun()) {
    console.log(
      `\n${EMOJI.INFO} To write to database, run: IMPORT_MODE=db npm run import:ballotpedia:load`
    )
  }

  await prisma.$disconnect()
}

loadBallotpedia().catch(console.error)
