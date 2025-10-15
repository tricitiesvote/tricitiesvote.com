/**
 * TCRC (Tri-City Regional Chamber) Questionnaire Scraper
 *
 * Extracts candidate questionnaire responses from the TCRC PDF using AI analysis.
 * Outputs to CSV for review before database import.
 *
 * Usage:
 *   npm run import:tcrc
 *
 * Requirements:
 *   - pdftotext installed (brew install poppler)
 *   - ANTHROPIC_API_KEY in environment
 *   - PDF downloaded to project root: 2025_Vote_for_Business_Primary_Candidate_Questionnaire.pdf
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import {
  EMOJI,
  escapeCsvField,
  RATE_LIMITS,
  generateEngagementSlug,
} from './config'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

interface QuestionnaireResponse {
  candidateName: string
  office: string
  participated: boolean
  notes?: string
}

async function extractPdfText(pdfPath: string): Promise<string> {
  console.log(`${EMOJI.SEARCH} Extracting text from PDF...`)

  try {
    const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`)
    console.log(`${EMOJI.SUCCESS} PDF text extracted (${stdout.length} characters)`)
    return stdout
  } catch (error) {
    console.error(`${EMOJI.ERROR} Failed to extract PDF text:`, error)
    throw error
  }
}

async function scrapeQuestionnaire() {
  console.log(`${EMOJI.SEARCH} Starting TCRC Questionnaire scraper...\n`)

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`${EMOJI.ERROR} ERROR: ANTHROPIC_API_KEY environment variable not set`)
    console.error('Please add it to your .env file or set it in your environment')
    process.exit(1)
  }

  // Check for PDF file
  const pdfPath = '2025_Vote_for_Business_Primary_Candidate_Questionnaire.pdf'
  const fs = await import('fs')
  if (!fs.existsSync(pdfPath)) {
    console.error(`${EMOJI.ERROR} ERROR: PDF file not found: ${pdfPath}`)
    console.error('Please download the PDF to the project root')
    process.exit(1)
  }

  // Fetch candidates from database for context
  console.log(`${EMOJI.SEARCH} Fetching 2025 candidates from database...`)
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
    },
    include: {
      office: {
        include: {
          region: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  console.log(`${EMOJI.SUCCESS} Found ${candidates.length} candidates\n`)

  // Extract PDF text
  const pdfText = await extractPdfText(pdfPath)

  // Use AI to parse the PDF structure
  console.log(`${EMOJI.ROBOT} Analyzing PDF with Claude AI...`)
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are parsing the Tri-City Regional Chamber of Commerce candidate questionnaire PDF.

This PDF contains:
1. Questions asked to candidates
2. Candidate responses (for those who participated)
3. List of candidates who did not respond

Known 2025 candidates from our database:
${candidates.map(c => `${c.name} - ${c.office.title} (${c.office.region.name})`).join('\n')}

Task: Parse the PDF text and extract a JSON array of candidate participation records.

For each candidate mentioned:
- Match their name to the database list above (use exact matches or very close matches)
- Determine if they participated (responded) or not
- Identify their office/race

Return a JSON array with objects containing:
- candidateName: string (exact name from database)
- office: string (office title)
- participated: boolean (true if they responded, false if listed as non-respondent)
- notes: string (optional - "Responded" or "Did not respond" or any other relevant notes)

Return ONLY valid JSON array. Example:
[
  {
    "candidateName": "John Doe",
    "office": "Kennewick City Council",
    "participated": true,
    "notes": "Responded"
  },
  {
    "candidateName": "Jane Smith",
    "office": "Pasco City Council",
    "participated": false,
    "notes": "Did not respond"
  }
]

PDF Text:
${pdfText}`,
      },
    ],
  })

  // Parse AI response
  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''

  let jsonText = responseText.trim()

  // Extract JSON from markdown code blocks
  const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1]
  } else {
    const arrayMatch = jsonText.match(/(\[[\s\S]*\])/)
    if (arrayMatch) {
      jsonText = arrayMatch[1]
    }
  }

  let responses: QuestionnaireResponse[] = []
  try {
    responses = JSON.parse(jsonText)
    console.log(`${EMOJI.SUCCESS} Parsed ${responses.length} candidate records\n`)
  } catch (error) {
    console.error(`${EMOJI.ERROR} Failed to parse AI response`)
    console.error('Raw response:', responseText.substring(0, 500))
    process.exit(1)
  }

  // Output CSV
  console.log('\n=== RESULTS ===')
  const csvHeaders = 'Candidate Name,Office,Participated,Notes'
  console.log(csvHeaders)

  const csvRows: string[] = []
  for (const response of responses) {
    const row = [
      escapeCsvField(response.candidateName),
      escapeCsvField(response.office),
      response.participated ? 'TRUE' : 'FALSE',
      escapeCsvField(response.notes || ''),
    ].join(',')

    console.log(row)
    csvRows.push(row)
  }

  // Save to file
  const csv = [csvHeaders, ...csvRows].join('\n')
  const outputPath = 'scripts/import/tcrc-responses.csv'
  fs.writeFileSync(outputPath, csv)

  // Summary
  const participated = responses.filter(r => r.participated).length
  const didNotRespond = responses.filter(r => !r.participated).length

  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total candidates: ${responses.length}`)
  console.log(`   Responded: ${participated}`)
  console.log(`   Did not respond: ${didNotRespond}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${outputPath}`)
  console.log(
    `${EMOJI.INFO} Review the CSV and then run: npm run import:tcrc:load`
  )

  await prisma.$disconnect()
}

scrapeQuestionnaire().catch(console.error)
