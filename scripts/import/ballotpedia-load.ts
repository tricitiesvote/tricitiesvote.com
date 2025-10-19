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

import { PrismaClient, Prisma } from '@prisma/client'
import * as fs from 'node:fs'
import {
  EMOJI,
  parseCsvLine,
  getOutputMode,
  generateEngagementSlug,
  escapeCsvField,
  isDryRun,
} from './config'
import { ADDITIONAL_CANDIDATE_ALIASES } from './2025-seats'

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

interface ResponseCsvRow {
  candidateName: string
  office: string
  questionOrder: number
  question: string
  answer: string
  url: string
}

const RESPONSES_CSV_PATH = 'scripts/import/ballotpedia-responses.csv'
const BALLOTPEDIA_QUESTIONNAIRE_SLUG = '2025-ballotpedia'

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function parseBallotpediaResponses(): ResponseCsvRow[] {
  if (!fs.existsSync(RESPONSES_CSV_PATH)) {
    return []
  }

  const content = fs.readFileSync(RESPONSES_CSV_PATH, 'utf-8')
  const lines = content.split('\n').slice(1) // skip header
  const rows: ResponseCsvRow[] = []
  let lineNum = 2

  for (const line of lines) {
    if (!line.trim()) {
      lineNum++
      continue
    }

    const fields = parseCsvLine(line, 7)
    if (!fields) {
      console.log(
        `${EMOJI.WARNING} Skipping malformed Ballotpedia response line ${lineNum}: ${line.substring(0, 50)}...`
      )
      lineNum++
      continue
    }

    const [candidateName, office, , questionOrderStr, question, answer, url] = fields
    const questionOrder = Number.parseInt(questionOrderStr, 10)

    rows.push({
      candidateName,
      office,
      questionOrder: Number.isFinite(questionOrder) ? questionOrder : rows.length + 1,
      question,
      answer,
      url
    })

    lineNum++
  }

  return rows
}

async function syncBallotpediaResponses(
  responseRows: ResponseCsvRow[],
  candidateLookup: Map<string, { id: string; name: string }>
): Promise<{ imported: number; unmatched: string[] }> {
  if (responseRows.length === 0) {
    console.log(`${EMOJI.INFO} No Ballotpedia response CSV found — skipping questionnaire import.`)
    return { imported: 0, unmatched: [] }
  }

  console.log(`${EMOJI.SEARCH} Processing Ballotpedia questionnaire responses...`)

  const unmatched: string[] = []

  const questionPositionMap = new Map<string, number>()
  for (const row of responseRows) {
    const existing = questionPositionMap.get(row.question)
    if (existing == null || row.questionOrder < existing) {
      questionPositionMap.set(row.question, row.questionOrder)
    }
  }

  const sortedQuestions = Array.from(questionPositionMap.entries())
    .sort((a, b) => {
      const orderCompare = a[1] - b[1]
      if (orderCompare !== 0) return orderCompare
      return a[0].localeCompare(b[0])
    })

  if (isDryRun()) {
    console.log(
      `${EMOJI.INFO} Would upsert Ballotpedia questionnaire with ${sortedQuestions.length} questions and ${responseRows.length} responses`
    )
    return { imported: responseRows.length, unmatched: [] }
  }

  const questionnaire = await prisma.questionnaire.upsert({
    where: { slug: BALLOTPEDIA_QUESTIONNAIRE_SLUG },
    create: {
      slug: BALLOTPEDIA_QUESTIONNAIRE_SLUG,
      title: 'Ballotpedia Candidate Connection 2025',
      year: 2025
    },
    update: {
      title: 'Ballotpedia Candidate Connection 2025'
    }
  })

  const questionRecords = new Map<string, { id: string; position: number }>()
  let positionIndex = 1
  for (const [questionText] of sortedQuestions) {
    const record = await prisma.questionnaireQuestion.upsert({
      where: {
        questionnaireId_position: {
          questionnaireId: questionnaire.id,
          position: positionIndex
        }
      },
      create: {
        questionnaireId: questionnaire.id,
        position: positionIndex,
        type: 'OPEN',
        question: questionText
      },
      update: {
        question: questionText,
        type: 'OPEN'
      }
    })

    questionRecords.set(questionText, { id: record.id, position: record.position })
    positionIndex++
  }

  await prisma.questionnaireResponse.deleteMany({
    where: { questionnaireId: questionnaire.id }
  })

  const createInputs: Prisma.QuestionnaireResponseCreateManyInput[] = []

  for (const row of responseRows) {
    const candidate = candidateLookup.get(normalizeName(row.candidateName))
    if (!candidate) {
      unmatched.push(`${row.candidateName} (${row.office})`)
      continue
    }

    const questionRecord = questionRecords.get(row.question)
    if (!questionRecord) {
      unmatched.push(`${row.candidateName} (${row.office}) — unknown question`)
      continue
    }

    createInputs.push({
      questionnaireId: questionnaire.id,
      questionId: questionRecord.id,
      candidateId: candidate.id,
      value: null,
      comment: row.url || null,
      textResponse: row.answer
    })
  }

  if (createInputs.length > 0) {
    await prisma.questionnaireResponse.createMany({
      data: createInputs,
      skipDuplicates: true
    })
  }

  console.log(
    `${EMOJI.SUCCESS} Imported ${createInputs.length} Ballotpedia questionnaire responses across ${questionRecords.size} questions`
  )

  return { imported: createInputs.length, unmatched }
}

async function loadBallotpedia() {
  console.log(`${EMOJI.SEARCH} Starting Ballotpedia loader...\n`)

  const outputMode = getOutputMode()
  console.log(outputMode.message)
  console.log()

  const csvPath = 'scripts/import/ballotpedia-data.csv'

  // Check for CSV file
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

  const candidateByNormalizedName = new Map<string, typeof candidates[number]>()
  for (const candidate of candidates) {
    candidateByNormalizedName.set(normalizeName(candidate.name), candidate)
  }

  for (const [alias, canonical] of Object.entries(ADDITIONAL_CANDIDATE_ALIASES)) {
    const canonicalMatch = candidateByNormalizedName.get(normalizeName(canonical))
    if (canonicalMatch) {
      candidateByNormalizedName.set(normalizeName(alias), canonicalMatch)
    }
  }

  const ballotpediaResponses = parseBallotpediaResponses()

  // Process each row
  const results: string[] = []
  let updated = 0
  let skipped = 0
  let errors = 0
  let engagementsParticipated = 0
  let engagementsNonParticipated = 0
  let responsesImported = 0
  let responseUnmatched: string[] = []

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
      // Handle survey completion engagement for all candidates
      const engagementNotes = row.surveyCompleted
        ? 'Completed Ballotpedia survey'
        : 'No Ballotpedia survey'
      const engagementLink = row.url || 'https://ballotpedia.org'

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
            participated: row.surveyCompleted,
            notes: engagementNotes,
            link: engagementLink,
          },
          update: {
            participated: row.surveyCompleted,
            notes: engagementNotes,
            link: engagementLink,
          },
        })
      } else {
        console.log(
          `${EMOJI.INFO} Would set Ballotpedia engagement for ${candidate.name} (${row.surveyCompleted ? 'participated' : 'did not participate'})`
        )
      }

      if (row.surveyCompleted) {
        engagementsParticipated++
      } else {
        engagementsNonParticipated++
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

  // Synchronize Ballotpedia questionnaire responses
  try {
    const responseSummary = await syncBallotpediaResponses(ballotpediaResponses, candidateByNormalizedName)
    responsesImported = responseSummary.imported
    responseUnmatched = responseSummary.unmatched
  } catch (error) {
    console.error(`${EMOJI.ERROR} Failed to import Ballotpedia responses`, error)
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
  console.log(`   Ballotpedia engagement - participated: ${engagementsParticipated}`)
  console.log(`   Ballotpedia engagement - no survey: ${engagementsNonParticipated}`)
  console.log(`   Ballotpedia responses imported: ${responsesImported}`)
  console.log(`   Errors: ${errors}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${resultsPath}`)

  if (isDryRun()) {
    console.log(
      `\n${EMOJI.INFO} To write to database, run: IMPORT_MODE=db npm run import:ballotpedia:load`
    )
  }

  if (responseUnmatched.length > 0) {
    console.log(`\n${EMOJI.WARNING} Unmatched Ballotpedia response rows:`)
    responseUnmatched.forEach(name => console.log(`   - ${name}`))
  }

  await prisma.$disconnect()
}

loadBallotpedia().catch(console.error)
