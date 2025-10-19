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

interface QuestionnaireParticipation {
  candidateName: string
  office: string
  participated: boolean
  notes?: string
}

interface QuestionnaireDetail {
  candidateName: string
  office: string
  question: string
  answer: string
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

Task: Parse the PDF text and extract candidate questionnaire information.

For each candidate mentioned:
- Match their name to the database list above (use exact or very close matches)
- Determine if they participated (responded) or not
- Identify their office/race
- When responses are present, capture each question prompt and the candidate's answer text (full prose)

Return ONLY valid JSON in the following structure:
{
  "participation": [
    {
      "candidateName": "Full database name",
      "office": "Office title",
      "participated": true,
      "notes": "Optional notes such as Responded / Did not respond"
    },
    ...
  ],
  "responses": [
    {
      "candidateName": "Full database name",
      "office": "Office title",
      "question": "Exact question text",
      "answer": "Full answer text"
    },
    ...
  ]
}

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
  const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1]
  } else {
    const arrayMatch = jsonText.match(/(\[[\s\S]*\])/)
    if (arrayMatch) {
      jsonText = arrayMatch[1]
    } else {
      const objectMatch = jsonText.match(/(\{[\s\S]*\})/)
      if (objectMatch) {
        jsonText = objectMatch[1]
      }
    }
  }

  type ExtractionPayload =
    | {
        participation: QuestionnaireParticipation[]
        responses: QuestionnaireDetail[]
      }
    | QuestionnaireParticipation[]

  let participationRecords: QuestionnaireParticipation[] = []
  let responseDetails: QuestionnaireDetail[] = []

  try {
    const parsed = JSON.parse(jsonText) as ExtractionPayload
    if (Array.isArray(parsed)) {
      participationRecords = parsed
      responseDetails = []
    } else {
      participationRecords = parsed.participation ?? []
      responseDetails = parsed.responses ?? []
    }
    console.log(`${EMOJI.SUCCESS} Parsed ${participationRecords.length} participation records`)
    console.log(`${EMOJI.SUCCESS} Parsed ${responseDetails.length} questionnaire responses\n`)
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
  for (const record of participationRecords) {
    const row = [
      escapeCsvField(record.candidateName),
      escapeCsvField(record.office),
      record.participated ? 'TRUE' : 'FALSE',
      escapeCsvField(record.notes || ''),
    ].join(',')

    console.log(row)
    csvRows.push(row)
  }

  // Save to file
  const csv = [csvHeaders, ...csvRows].join('\n')
  const outputPath = 'scripts/import/tcrc-responses.csv'
  fs.writeFileSync(outputPath, csv)

  if (responseDetails.length > 0) {
    const detailHeaders = 'Candidate Name,Office,Question,Answer'
    const detailRows = responseDetails.map(detail =>
      [
        escapeCsvField(detail.candidateName),
        escapeCsvField(detail.office),
        escapeCsvField(detail.question),
        escapeCsvField(detail.answer),
      ].join(',')
    )
    const detailOutputPath = 'scripts/import/tcrc-questionnaire-responses.csv'
    fs.writeFileSync(detailOutputPath, [detailHeaders, ...detailRows].join('\n'))
    console.log(`${EMOJI.SUCCESS} Detailed responses saved to ${detailOutputPath}`)
  } else {
    console.log(`${EMOJI.INFO} No detailed responses detected in PDF output`)
  }

  // Summary
  const participated = participationRecords.filter(r => r.participated).length
  const didNotRespond = participationRecords.filter(r => !r.participated).length

  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total candidates: ${participationRecords.length}`)
  console.log(`   Responded: ${participated}`)
  console.log(`   Did not respond: ${didNotRespond}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${outputPath}`)
  console.log(
    `${EMOJI.INFO} Review the CSV and then run: npm run import:tcrc:load`
  )

  await prisma.$disconnect()
}

scrapeQuestionnaire().catch(console.error)
