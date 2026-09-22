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

import * as fs from 'fs'
import { chromium, Page } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { EMOJI, escapeCsvField, RATE_LIMITS } from './config'

const prisma = new PrismaClient()

// One JSON line per candidate already scraped. Progress is written here after
// each candidate, so an interrupted or scoped run resumes without re-hitting
// Ballotpedia. Pass --refresh to ignore and rebuild the cache.
const CACHE_PATH = 'scripts/import/ballotpedia-cache.jsonl'

interface CacheEntry {
  candidateName: string
  office: string
  notFound: boolean
  data: BallotpediaData | null
  responses: SurveyResponseRow[]
}

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

function formatNameForUrl(name: string): string {
  const override = BALLOTPEDIA_NAME_OVERRIDES[name]
  if (override) {
    return override
  }
  return name.replace(/ /g, '_')
}

/**
 * There is no single URL-construction rule that works across 2026 races:
 * congressional/legislative candidates often live at a plain name page
 * (e.g. /Jerrod_Sessler) or a disambiguation page pointing at one
 * (e.g. /Amanda_McKinney → /Amanda_McKinney_(Washington)), while
 * county/local candidates live at a fully qualified page
 * (e.g. /Kohl_St._Peter_(Franklin_County_Sheriff,_Washington,_candidate_2026)).
 * Plain-name guesses are also case-sensitive beyond the first character, so a
 * DB name with unusual casing (e.g. "Kohl ST. Peter") won't match the real
 * page. Because of this, URL resolution is done live in the browser instead
 * of by constructing a guessed slug.
 */
const RESOLVER_YEAR = 2026
const INTERNAL_NAV_WAIT = 1000

interface PageClassification {
  url: string
  exists: boolean
  isDisambiguation: boolean
  title: string | null
}

async function classifyCurrentPage(page: Page): Promise<Omit<PageClassification, 'url'>> {
  const bodyText = (await page.textContent('body').catch(() => '')) || ''
  const title = await page.textContent('#firstHeading').catch(() => null)
  const exists = !!title && !bodyText.includes("Oops! The page you're looking for does not exist")
  const isDisambiguation =
    exists && !!(await page.$('a[href*="Ballotpedia:Disambiguation"]').catch(() => null))
  return { exists, isDisambiguation, title }
}

async function gotoAndClassify(page: Page, url: string): Promise<PageClassification> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(800)
  } catch {
    return { url, exists: false, isDisambiguation: false, title: null }
  }
  const classification = await classifyCurrentPage(page)
  return { url: page.url(), ...classification }
}

function officeKeywords(officeTitle: string): string[] {
  return officeTitle
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !['district', 'position', 'pos.'].includes(w))
}

/**
 * A disambiguation page lists several people sharing a name. Pick the link
 * that plausibly refers to this Washington candidate/office.
 */
async function pickDisambiguationTarget(page: Page, officeTitle: string): Promise<string | null> {
  const links = await page.evaluate(() => {
    const container = document.querySelector('.mw-parser-output')
    if (!container) return [] as string[]
    return Array.from(container.querySelectorAll('a[href^="/"]'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') || '')
      .filter(Boolean)
  })

  const words = officeKeywords(officeTitle)
  const decoded = links.map(href => ({ href, text: decodeURIComponent(href).toLowerCase() }))

  let best = decoded.find(l => l.text.includes('washington') && words.some(w => l.text.includes(w)))
  if (!best) best = decoded.find(l => l.text.includes('washington'))
  if (!best) best = decoded.find(l => l.text.includes(`candidate_${RESOLVER_YEAR}`))

  return best ? `https://ballotpedia.org${best.href}` : null
}

/**
 * Fall back to Ballotpedia's own search when neither the plain name page
 * nor the qualified guess resolves.
 */
async function searchForCandidateUrl(
  page: Page,
  candidateName: string,
  officeTitle: string
): Promise<string | null> {
  const searchUrl = `https://ballotpedia.org/Special:Search?search=${encodeURIComponent(`"${candidateName}"`)}`

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1000)
  } catch {
    return null
  }

  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.mw-search-result-heading a'))
      .map(a => (a as HTMLAnchorElement).getAttribute('href') || '')
      .filter(Boolean)
  })

  if (results.length === 0) return null

  const words = officeKeywords(officeTitle)
  const decoded = results.map(href => ({ href, text: decodeURIComponent(href).toLowerCase() }))

  let best = decoded.find(
    l => l.text.includes(`candidate_${RESOLVER_YEAR}`) && words.some(w => l.text.includes(w))
  )
  if (!best) best = decoded.find(l => l.text.includes(`candidate_${RESOLVER_YEAR}`))
  if (!best) best = decoded.find(l => l.text.includes('washington') && words.some(w => l.text.includes(w)))

  return best ? `https://ballotpedia.org${best.href}` : null
}

/**
 * Resolve a candidate's real Ballotpedia URL by driving the headless
 * browser through the same paths a human would follow:
 *   1. Try the plain name page.
 *      - Real candidate/officeholder page → use it.
 *      - Disambiguation page → follow the Washington/office-relevant link.
 *      - Missing → fall through.
 *   2. Try the fully qualified guess "<Name>_(<Office>,_Washington,_candidate_2026)".
 *   3. Fall back to Ballotpedia's own search and take the best candidate-page match.
 * Returns null if nothing plausible is found (caller should treat as not-found,
 * not fabricate a URL).
 */
async function resolveCandidateUrl(
  page: Page,
  candidateName: string,
  officeTitle: string
): Promise<string | null> {
  const formattedName = formatNameForUrl(candidateName)

  // 1. Plain name page
  const direct = await gotoAndClassify(page, `https://ballotpedia.org/${formattedName}`)

  if (direct.exists && !direct.isDisambiguation) {
    return direct.url
  }

  if (direct.exists && direct.isDisambiguation) {
    const target = await pickDisambiguationTarget(page, officeTitle)
    if (target) {
      await page.waitForTimeout(INTERNAL_NAV_WAIT)
      const followed = await gotoAndClassify(page, target)
      if (followed.exists && !followed.isDisambiguation) {
        return followed.url
      }
    }
  }

  // 2. Qualified guess (works when DB name casing matches Ballotpedia's exactly)
  await page.waitForTimeout(INTERNAL_NAV_WAIT)
  const formattedOffice = officeTitle.replace(/ /g, '_')
  const guessUrl = `https://ballotpedia.org/${formattedName}_(${formattedOffice},_Washington,_candidate_${RESOLVER_YEAR})`
  const guess = await gotoAndClassify(page, guessUrl)
  if (guess.exists && !guess.isDisambiguation) {
    return guess.url
  }

  // 3. Search fallback
  await page.waitForTimeout(INTERNAL_NAV_WAIT)
  const searchResult = await searchForCandidateUrl(page, candidateName, officeTitle)
  if (searchResult) {
    await page.waitForTimeout(INTERNAL_NAV_WAIT)
    const resolved = await gotoAndClassify(page, searchResult)
    if (resolved.exists && !resolved.isDisambiguation) {
      return resolved.url
    }
  }

  return null
}

async function scrapeBallotpedia() {
  console.log(`${EMOJI.SEARCH} Starting Ballotpedia scraper...\n`)

  // Fetch candidates
  console.log(`${EMOJI.SEARCH} Fetching 2026 candidates from database...`)
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2026,
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

  // Optional scoping flags for bounded/inline runs:
  //   --only="Name A|Name B"  restrict to specific candidate names
  //   --limit=N               cap the number processed
  const onlyArg = process.argv.find(a => a.startsWith('--only='))
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  let scoped = candidates
  if (onlyArg) {
    const names = onlyArg.slice('--only='.length).split('|').map(s => s.trim().toLowerCase())
    scoped = scoped.filter(c => names.includes(c.name.toLowerCase()))
  }
  if (limitArg) {
    const n = Number.parseInt(limitArg.slice('--limit='.length), 10)
    if (Number.isFinite(n)) scoped = scoped.slice(0, n)
  }
  const candidatesToRun = scoped

  console.log(`${EMOJI.SUCCESS} Found ${candidates.length} candidates (running ${candidatesToRun.length})\n`)

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

  const refresh = process.argv.includes('--refresh')
  if (refresh && fs.existsSync(CACHE_PATH)) {
    fs.rmSync(CACHE_PATH)
  }

  // Load prior progress so a resumed run skips candidates already scraped.
  const cache = new Map<string, CacheEntry>()
  if (!refresh && fs.existsSync(CACHE_PATH)) {
    for (const line of fs.readFileSync(CACHE_PATH, 'utf-8').split('\n')) {
      if (!line.trim()) continue
      try {
        const entry = JSON.parse(line) as CacheEntry
        cache.set(entry.candidateName, entry)
      } catch {
        // skip a malformed line rather than abort the whole run
      }
    }
    console.log(`${EMOJI.INFO} Resuming: ${cache.size} candidates already cached\n`)
  }

  const appendCache = (entry: CacheEntry) => {
    fs.appendFileSync(CACHE_PATH, JSON.stringify(entry) + '\n')
    cache.set(entry.candidateName, entry)
  }

  // Seed output arrays from the cache for candidates in this run's scope.
  const runNames = new Set(candidatesToRun.map(c => c.name))
  for (const entry of cache.values()) {
    if (!runNames.has(entry.candidateName)) continue
    if (entry.notFound) {
      notFoundUrls.push({ name: entry.candidateName, office: entry.office, url: '' })
    } else if (entry.data) {
      results.push(entry.data)
      surveyResponses.push(...entry.responses)
    }
  }

  for (const candidate of candidatesToRun) {
    processed++

    if (!refresh && cache.has(candidate.name)) {
      console.log(
        `[${processed}/${candidatesToRun.length}] ${EMOJI.SKIP} cached: ${candidate.name}`
      )
      continue
    }

    console.log(
      `\n[${processed}/${candidatesToRun.length}] ${EMOJI.PROCESSING} ${candidate.name}`
    )

    const url = await resolveCandidateUrl(page, candidate.name, candidate.office.title)

    if (!url) {
      console.log(`  ${EMOJI.SKIP} No Ballotpedia page found`)
      notFound++
      notFoundUrls.push({
        name: candidate.name,
        office: candidate.office.title,
        url: '',
      })
      appendCache({
        candidateName: candidate.name,
        office: candidate.office.title,
        notFound: true,
        data: null,
        responses: [],
      })
      await page.waitForTimeout(RATE_LIMITS.PAGE_LOADS)
      continue
    }

    console.log(`  URL: ${url}`)

    try {
      // The page is already loaded at `url` by resolveCandidateUrl; give any
      // remaining dynamic content (accordion, infobox) a moment to settle.
      await page.waitForTimeout(500)

      const pageBody = await page.textContent('body').catch(() => '') || ''

      // Check for completed survey
      // Method 1: Look for survey completion text in first paragraph
      const firstParagraph = await page.textContent('.mw-parser-output > p').catch(() => '')

      const surveyCompleted =
        (firstParagraph?.includes('completed Ballotpedia') &&
        (firstParagraph?.includes('survey in 2025') || firstParagraph?.includes('survey in 2026'))) || false

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
      const dataRow: BallotpediaData = {
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
      }
      results.push(dataRow)

      const candidateResponses: SurveyResponseRow[] = []
      if (actualSurveyCompleted && candidateSurveyResponses.length > 0) {
        candidateSurveyResponses.forEach((entry, index) => {
          candidateResponses.push({
            candidateName: candidate.name,
            office: candidate.office.title,
            region: candidate.office.region.name,
            questionOrder: index + 1,
            question: entry.question,
            answer: entry.answer,
            url,
          })
        })
        surveyResponses.push(...candidateResponses)
      }

      appendCache({
        candidateName: candidate.name,
        office: candidate.office.title,
        notFound: false,
        data: dataRow,
        responses: candidateResponses,
      })

      found++
    } catch (error) {
      console.error(`  ${EMOJI.ERROR} Error scraping:`, error)
      const dataRow: BallotpediaData = {
        candidateName: candidate.name,
        office: candidate.office.title,
        region: candidate.office.region.name,
        url,
        surveyCompleted: false,
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
      results.push(dataRow)
      appendCache({
        candidateName: candidate.name,
        office: candidate.office.title,
        notFound: false,
        data: dataRow,
        responses: [],
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
