/**
 * Ballotpedia Scraper
 *
 * Scrapes candidate information from Ballotpedia including:
 * - Campaign survey completion status
 * - Biographical information
 * - Contact information
 * - Website/social media
 *
 * Usage:
 *   npm run import:ballotpedia
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - Playwright browsers installed (npx playwright install chromium)
 *
 * Output:
 *   - scripts/import/ballotpedia-data.csv
 */

import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { EMOJI, escapeCsvField, RATE_LIMITS } from './config'

const prisma = new PrismaClient()

interface BallotpediaData {
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

interface SurveyResponseRow {
  candidateName: string
  office: string
  region: string
  questionOrder: number
  question: string
  answer: string
  url: string
}

/**
 * Convert candidate name to Ballotpedia URL format
 * Examples:
 *   "John Doe" → "John_Doe"
 *   "Kurt H. Maier" → "Kurt_H._Maier"
 *   "John Doe Jr." → "John_Doe_Jr."
 */
const BALLOTPEDIA_NAME_OVERRIDES: Record<string, string> = {
  'Leo Perales': 'Leo_A._Perales',
  'Kurt H Maier': 'Kurt_H._Maier'
}

const MAYOR_OFFICE_SLUGS: Record<string, string> = {
  Kennewick: 'Mayor_of_Kennewick',
  Pasco: 'Mayor_of_Pasco',
  Richland: 'Mayor_of_Richland',
  'West Richland': 'Mayor_of_West_Richland'
}

function formatNameForUrl(name: string): string {
  const override = BALLOTPEDIA_NAME_OVERRIDES[name]
  if (override) {
    return override
  }
  return name.replace(/ /g, '_')
}

/**
 * Convert office to Ballotpedia URL format
 * Based on patterns from ballotpedia-overview.md
 *
 * City Council patterns:
 *   - Ward-based: "Kennewick City Council Ward 1" → "Kennewick_City_Council_Ward_1_Position_1"
 *   - District-based: "Pasco City Council District 3" → "Pasco_City_Council_District_3_Position_3"
 *   - Position-based: "Richland City Council Position 3" → "Richland_City_Council_Position_3"
 *   - At-large: "Kennewick City Council Position 4" → "Kennewick_City_Council_At-large_Position_4" (if at-large)
 *
 * School Board patterns:
 *   - "Kennewick School Board District 1" → "Kennewick_School_District_school_board_Position_1" (uses Position not District!)
 *   - "Pasco School Board District 3" → "Pasco_School_District_school_board_District_3"
 *   - "Pasco School Board At-Large Position 5" → "Pasco_School_District_school_board_Position_5_At-large"
 */
function formatOfficeForUrl(office: string, officeType: string): string {
  if (officeType === 'MAYOR') {
    const cityMatch = office.match(/^(.*) Mayor$/)
    if (cityMatch) {
      const city = cityMatch[1]
      return MAYOR_OFFICE_SLUGS[city] ?? `Mayor_of_${city.replace(/ /g, '_')}`
    }
    return office.replace(/ /g, '_')
  }

  if (officeType === 'SCHOOL_BOARD') {
    // Parse: "{City} School Board {Type} {Number}"
    // Pattern: City_School_District_school_board_Position_N or _District_N or _Position_N_At-large

    const cityMatch = office.match(/^(\w+(?:\s+\w+)?)\s+School Board/)
    if (!cityMatch) return office.replace(/ /g, '_')

    const city = cityMatch[1]
    let result = `${city}_School_District_school_board`

    // Check for At-Large (Pasco uses Position_N_At-large format)
    if (office.includes('At-Large') || office.includes('At Large')) {
      const posMatch = office.match(/Position\s+(\d+)/)
      if (posMatch) {
        result += `_Position_${posMatch[1]}_At-large`
      }
    }
    // Check for District N
    else if (office.includes('District')) {
      const districtMatch = office.match(/District\s+(\d+)/)
      if (districtMatch) {
        const num = districtMatch[1]
        // Kennewick uses Position_N, Pasco uses District_N
        if (city === 'Kennewick') {
          result += `_Position_${num}`
        } else {
          result += `_District_${num}`
        }
      }
    }
    // Default: Position N (Richland, West Richland)
    else {
      const posMatch = office.match(/Position\s+(\d+)/)
      if (posMatch) {
        result += `_Position_${posMatch[1]}`
      }
    }

    return result
  }

  if (officeType === 'CITY_COUNCIL') {
    // Parse: "{City} City Council {Type} {Number}"

    const cityMatch = office.match(/^(\w+(?:\s+\w+)?)\s+City Council/)
    if (!cityMatch) return office.replace(/ /g, '_')

    const city = cityMatch[1]
    let result = `${city}_City_Council`

    // Ward-based: Ward N → Ward_N_Position_N (ward and position numbers match)
    if (office.includes('Ward')) {
      const wardMatch = office.match(/Ward\s+(\d+)/)
      if (wardMatch) {
        const num = wardMatch[1]
        result += `_Ward_${num}_Position_${num}`
      }
    }
    // District-based: District N Position N (Pasco - numbers match)
    else if (office.includes('District')) {
      const districtMatch = office.match(/District\s+(\d+)/)
      if (districtMatch) {
        const num = districtMatch[1]
        result += `_District_${num}_Position_${num}`
      }
    }
    // At-large: At-large Position N
    else if (office.includes('At-Large') || office.includes('At Large')) {
      const posMatch = office.match(/Position\s+(\d+)/)
      if (posMatch) {
        result += `_At-large_Position_${posMatch[1]}`
      }
    }
    // Simple position: Position N
    else if (office.includes('Position')) {
      const posMatch = office.match(/Position\s+(\d+)/)
      if (posMatch) {
        const posNum = posMatch[1]

        // Kennewick Position 4 is At-Large
        if (city === 'Kennewick' && posNum === '4') {
          result += `_At-large_Position_${posNum}`
        } else {
          result += `_Position_${posNum}`
        }
      }
    }

    return result
  }

  // Fallback: just replace spaces
  return office.replace(/ /g, '_')
}

/**
 * Build Ballotpedia URL for a candidate
 */
function buildBallotpediaUrl(candidateName: string, office: string, officeType: string): string {
  const formattedName = formatNameForUrl(candidateName)
  const formattedOffice = formatOfficeForUrl(office, officeType)

  return `https://ballotpedia.org/${formattedName}_(${formattedOffice},_Washington,_candidate_2025)`
}

async function scrapeBallotpedia() {
  console.log(`${EMOJI.SEARCH} Starting Ballotpedia scraper...\n`)

  // Fetch candidates
  console.log(`${EMOJI.SEARCH} Fetching 2025 candidates from database...`)
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      office: {
        type: {
          not: 'PORT_COMMISSIONER', // Skip port races
        },
      },
    },
    include: {
      office: {
        include: {
          region: true,
        },
      },
    },
    orderBy: [{ office: { region: { name: 'asc' } } }, { name: 'asc' }],
  })

  console.log(`${EMOJI.SUCCESS} Found ${candidates.length} candidates\n`)

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  const results: BallotpediaData[] = []
  const surveyResponses: SurveyResponseRow[] = []
  const notFoundUrls: Array<{ name: string; office: string; url: string }> = []
  let processed = 0
  let found = 0
  let notFound = 0

  for (const candidate of candidates) {
    processed++

    const url = buildBallotpediaUrl(
      candidate.name,
      candidate.office.title,
      candidate.office.type
    )

    console.log(
      `\n[${processed}/${candidates.length}] ${EMOJI.PROCESSING} ${candidate.name}`
    )
    console.log(`  URL: ${url}`)

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      // Wait for content to load
      await page.waitForTimeout(1000)

      // Check if page exists (Ballotpedia returns 200 even for non-existent pages)
      // Look for "does not exist" text in the page body, not just the title
      const pageBody = await page.textContent('body').catch(() => '') || ''
      const pageTitle = await page.textContent('#firstHeading').catch(() => null)

      if (!pageTitle || pageBody.includes("Oops! The page you're looking for does not exist")) {
        console.log(`  ${EMOJI.SKIP} Page does not exist`)
        notFound++
        notFoundUrls.push({
          name: candidate.name,
          office: candidate.office.title,
          url,
        })
        continue
      }

      // Check for completed survey
      // Method 1: Look for survey completion text in first paragraph
      const firstParagraph = await page.textContent('.mw-parser-output > p').catch(() => '')

      const surveyCompleted =
        (firstParagraph?.includes('completed Ballotpedia') &&
        firstParagraph?.includes('survey in 2025')) || false

      // Method 2: Verify Campaign themes section exists (additional confirmation)
      const { surveyCompleted: hasSurveyContent, responses: candidateSurveyResponses } = await page.evaluate(() => {
        const normalizeText = (input: string | null | undefined) =>
          (input ?? '')
            .replace(/\s+/g, ' ')
            .trim()

        const responses: Array<{ question: string; answer: string }> = []

        const accordionPanels = Array.from(document.querySelectorAll('#accordion .panel')) as HTMLElement[]
        for (const panel of accordionPanels) {
          const question = normalizeText(panel.querySelector('.panel-title')?.textContent ?? '')
          const answer = normalizeText(panel.querySelector('.panel-body')?.textContent ?? '')
          if (question && answer) {
            responses.push({ question, answer })
          }
        }

        if (responses.length === 0) {
          const questionElements = Array.from(
            document.querySelectorAll('#Candidate_Connection_survey .survey-question, #Campaign_themes .survey-question')
          ) as HTMLElement[]
          if (questionElements.length > 0) {
            const responseElements = Array.from(
              document.querySelectorAll('#Candidate_Connection_survey .survey-response, #Campaign_themes .survey-response')
            ) as HTMLElement[]
            const pairCount = Math.min(questionElements.length, responseElements.length)

            for (let i = 0; i < pairCount; i++) {
              const question = normalizeText(questionElements[i].textContent ?? '')
              const answer = normalizeText(responseElements[i].textContent ?? '')
              if (question && answer) {
                responses.push({ question, answer })
              }
            }
          }
        }

        return {
          surveyCompleted: responses.length > 0,
          responses
        }
      })

      const pageBodyLower = pageBody.toLowerCase()
      const hasExplicitIncomplete =
        pageBodyLower.includes("has not yet completed ballotpedia's candidate connection survey") ||
        pageBodyLower.includes('has not completed ballotpedia') ||
        pageBodyLower.includes('has not yet completed ballotpedia’s candidate connection survey')

      const actualSurveyCompleted = !hasExplicitIncomplete && candidateSurveyResponses.length > 0

      console.log(
        `  ${actualSurveyCompleted ? EMOJI.SUCCESS : EMOJI.INFO} Survey: ${actualSurveyCompleted ? 'Completed' : 'Not completed'}`
      )

      // Extract bio (if available)
      let bio: string | undefined

      // Try to get bio from infobox or main content
      const bioText = await page
        .locator('.infobox, .mw-parser-output > p')
        .first()
        .textContent()
        .catch(() => undefined)

      if (bioText && bioText.length > 50) {
        bio = bioText.trim().substring(0, 500) // Limit length
      }

      // Extract website/contact info from infobox if present
      let website: string | undefined
      let email: string | undefined

      const websiteLink = await page
        .locator('.infobox a[href*="http"]')
        .first()
        .getAttribute('href')
        .catch(() => undefined)

      if (websiteLink && !websiteLink.includes('ballotpedia.org')) {
        website = websiteLink
      }

      // Store result
      results.push({
        candidateName: candidate.name,
        office: candidate.office.title,
        region: candidate.office.region.name,
        url,
        surveyCompleted: actualSurveyCompleted,
        bio,
        website,
        email,
        notes: actualSurveyCompleted
          ? 'Completed Ballotpedia survey'
          : 'Page exists but no survey',
      })

      if (actualSurveyCompleted && candidateSurveyResponses.length > 0) {
        candidateSurveyResponses.forEach((entry, index) => {
          surveyResponses.push({
            candidateName: candidate.name,
            office: candidate.office.title,
            region: candidate.office.region.name,
            questionOrder: index + 1,
            question: entry.question,
            answer: entry.answer,
            url,
          })
        })
      }

      found++
    } catch (error) {
      console.error(`  ${EMOJI.ERROR} Error scraping:`, error)
      results.push({
        candidateName: candidate.name,
        office: candidate.office.title,
        region: candidate.office.region.name,
        url,
        surveyCompleted: false,
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    // Rate limit
    await page.waitForTimeout(RATE_LIMITS.PAGE_LOADS)
  }

  await browser.close()

  // Output CSV
  console.log('\n\n=== RESULTS ===')
  const csvHeaders =
    'Candidate Name,Office,Region,URL,Survey Completed,Bio,Website,Email,Notes'
  console.log(csvHeaders)

  const csvLines = results.map(r =>
    [
      escapeCsvField(r.candidateName),
      escapeCsvField(r.office),
      escapeCsvField(r.region),
      escapeCsvField(r.url),
      r.surveyCompleted ? 'TRUE' : 'FALSE',
      escapeCsvField(r.bio || ''),
      escapeCsvField(r.website || ''),
      escapeCsvField(r.email || ''),
      escapeCsvField(r.notes || ''),
    ].join(',')
  )

  for (const line of csvLines) {
    console.log(line)
  }

  // Save to file
  const fs = await import('fs')
  const csv = [csvHeaders, ...csvLines].join('\n')
  const outputPath = 'scripts/import/ballotpedia-data.csv'
  fs.writeFileSync(outputPath, csv)

  const responsesOutputPath = 'scripts/import/ballotpedia-responses.csv'
  const responsesHeaders =
    'Candidate Name,Office,Region,Question Order,Question,Answer,URL'
  const responsesLines = surveyResponses.map(r =>
    [
      escapeCsvField(r.candidateName),
      escapeCsvField(r.office),
      escapeCsvField(r.region),
      String(r.questionOrder),
      escapeCsvField(r.question),
      escapeCsvField(r.answer),
      escapeCsvField(r.url),
    ].join(',')
  )
  const responsesCsv = [responsesHeaders, ...responsesLines].join('\n')
  fs.writeFileSync(responsesOutputPath, responsesCsv)

  // Save 404s to separate file
  if (notFoundUrls.length > 0) {
    const notFoundCsvHeaders = 'Candidate Name,Office,URL'
    const notFoundCsvLines = notFoundUrls.map(nf =>
      [escapeCsvField(nf.name), escapeCsvField(nf.office), escapeCsvField(nf.url)].join(',')
    )
    const notFoundCsv = [notFoundCsvHeaders, ...notFoundCsvLines].join('\n')
    const notFoundPath = 'scripts/import/ballotpedia-404s.csv'
    fs.writeFileSync(notFoundPath, notFoundCsv)
    console.log(`\n${EMOJI.INFO} 404s saved to ${notFoundPath}`)
  }

  // Summary
  const surveysCompleted = results.filter(r => r.surveyCompleted).length

  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total processed: ${processed}`)
  console.log(`   Pages found: ${found}`)
  console.log(`   Pages not found: ${notFound}`)
  console.log(`   Surveys completed: ${surveysCompleted}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${outputPath}`)
  console.log(`${EMOJI.SUCCESS} Survey responses saved to ${responsesOutputPath}`)
  console.log(`${EMOJI.INFO} Review the CSV and then run: npm run import:ballotpedia:load`)

  await prisma.$disconnect()
}

scrapeBallotpedia().catch(console.error)
