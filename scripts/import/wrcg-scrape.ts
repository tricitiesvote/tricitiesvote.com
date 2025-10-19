/**
 * WRCG (West Richland Citizens Group) Scraper
 *
 * Scrapes candidate questionnaire responses from WRCG website.
 * West Richland only (9 candidates for 2025 election).
 *
 * Usage:
 *   npm run import:wrcg
 *
 * Requirements:
 *   - DATABASE_URL in environment
 *   - ANTHROPIC_API_KEY in environment (for parsing questionnaire format)
 *   - Playwright browsers installed (npx playwright install chromium)
 *
 * Output:
 *   - scripts/import/wrcg-responses.csv
 *
 * Note: Wix sites require conservative rate limiting and special wait strategies.
 */

import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { EMOJI, escapeCsvField, RATE_LIMITS } from './config'

const prisma = new PrismaClient()

interface WrcgResponse {
  candidateName: string
  url: string
  hasQuestionnaire: boolean
  questionnaireText?: string
  notes?: string
  responses?: QuestionAnswer[]
}

interface QuestionAnswer {
  position: number
  question: string
  answer: string
}

async function scrapeWrcg() {
  console.log(`${EMOJI.SEARCH} Starting WRCG scraper...\n`)

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      `${EMOJI.ERROR} ERROR: ANTHROPIC_API_KEY environment variable not set`
    )
    console.error('Please add it to your .env file or set it in your environment')
    process.exit(1)
  }

  // Fetch West Richland candidates only
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

  console.log(`${EMOJI.SUCCESS} Found ${candidates.length} West Richland candidates\n`)

  if (candidates.length === 0) {
    console.log(`${EMOJI.WARNING} No West Richland candidates found in database`)
    console.log('Exiting...')
    await prisma.$disconnect()
    return
  }

  // Launch browser with special Wix-friendly settings
  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()

  const results: WrcgResponse[] = []
  const detailedResponses: Array<{
    candidateName: string
    position: number
    question: string
    answer: string
    url: string
  }> = []
  let processed = 0

  // First, visit the main elections page to understand the structure
  const mainPageUrl = 'https://www.wrcg.org/2025-elections'
  console.log(`${EMOJI.PROCESSING} Loading main elections page...`)
  console.log(`  URL: ${mainPageUrl}\n`)

  await page.goto(mainPageUrl, {
    waitUntil: 'networkidle',
    timeout: 60000,
  })

  // Wait for Wix to fully render
  await page.waitForSelector('#PAGES_CONTAINER').catch(() => {})
  await page.waitForTimeout(RATE_LIMITS.WIX_LOADS)

  // Extract candidate profile links
  // WRCG uses format: https://www.wrcg.org/{firstlast} (lowercase, no spaces)
  console.log(`${EMOJI.SEARCH} Looking for candidate profile links...\n`)

  const profileLinks = await page.$$eval('a[href*="wrcg.org/"]', links =>
    links
      .map(a => (a as HTMLAnchorElement).href)
      .filter(href => {
        // Filter for candidate profile URLs (single word after domain, no dashes/numbers)
        const match = href.match(/wrcg\.org\/([a-z]+)$/i)
        return match && match[1].length > 3 // Avoid very short URLs like /new, /faq
      })
  )

  const uniqueLinks = [...new Set(profileLinks)]
  console.log(`${EMOJI.SUCCESS} Found ${uniqueLinks.length} potential candidate profile links`)

  if (uniqueLinks.length === 0) {
    console.log(
      `${EMOJI.WARNING} No candidate links found on main page. Will try constructing URLs from candidate names.`
    )
  }

  // Process each candidate
  for (const candidate of candidates) {
    processed++

    // Try to construct URL from name (firstname + lastname, lowercase, no spaces)
    const nameParts = candidate.name.toLowerCase().split(' ')
    const firstLast = nameParts.filter(p => p.length > 1).join('') // Remove middle initials

    const constructedUrl = `https://www.wrcg.org/${firstLast}`

    // Use constructed URL or found link
    const urlToTry = constructedUrl

    console.log(
      `\n[${processed}/${candidates.length}] ${EMOJI.PROCESSING} ${candidate.name}`
    )
    console.log(`  URL: ${urlToTry}`)

    try {
      const response = await page.goto(urlToTry, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })

      // Check if page loaded successfully
      if (!response || response.status() === 404) {
        console.log(`  ${EMOJI.SKIP} Page not found (404)`)
        results.push({
          candidateName: candidate.name,
          url: urlToTry,
          hasQuestionnaire: false,
          notes: 'Page not found',
        })
        continue
      }

      // Wait for Wix to render
      await page.waitForSelector('#PAGES_CONTAINER').catch(() => {})
      await page.waitForTimeout(RATE_LIMITS.WIX_LOADS)

      // Extract questionnaire content
      const extraction = await page.evaluate(() => {
        const normalize = (value: string | null | undefined) =>
          (value ?? '')
            .replace(/\s+/g, ' ')
            .trim()

        const main = document.querySelector('#PAGES_CONTAINER')
        if (!main) {
          return {
            plainText: '',
            responses: [] as Array<{ position: number; question: string; answer: string }>
          }
        }

        const paragraphs = Array.from(main.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
          .map(element => normalize(element.textContent))
          .filter(text => text.length > 0)

        type WorkingResponse = {
          position: number
          question: string
          answers: string[]
        }

        const responses: WorkingResponse[] = []
        let current: WorkingResponse | null = null

        const commit = () => {
          if (current && current.question && current.answers.length > 0) {
            responses.push(current)
          }
          current = null
        }

        for (const paragraph of paragraphs) {
          const match = paragraph.match(/^(\d+)\s*[\).\:-]\s*(.+)$/)
          if (match) {
            commit()
            current = {
              position: Number.parseInt(match[1], 10),
              question: match[2].trim(),
              answers: []
            }
            continue
          }

          if (current) {
            current.answers.push(paragraph)
          }
        }

        commit()

        return {
          plainText: paragraphs.join('\n\n'),
          responses: responses.map(item => ({
            position: item.position,
            question: item.question,
            answer: item.answers.join('\n\n')
          }))
        }
      })

      const pageText = extraction.plainText

      if (!pageText || pageText.length < 100) {
        console.log(`  ${EMOJI.SKIP} Insufficient text content found`)
        results.push({
          candidateName: candidate.name,
          url: urlToTry,
          hasQuestionnaire: false,
          notes: 'Page exists but no questionnaire content found',
        })
        continue
      }

      const hasResponses = extraction.responses.length > 0

      if (hasResponses) {
        console.log(`  ${EMOJI.SUCCESS} Found questionnaire content`)
        results.push({
          candidateName: candidate.name,
          url: urlToTry,
          hasQuestionnaire: true,
          questionnaireText: pageText,
          notes: 'Questionnaire found',
          responses: extraction.responses,
        })
        extraction.responses.forEach(entry => {
          detailedResponses.push({
            candidateName: candidate.name,
            position: entry.position,
            question: entry.question,
            answer: entry.answer,
            url: urlToTry,
          })
        })
      } else {
        console.log(`  ${EMOJI.INFO} Page exists but no questionnaire format detected`)
        results.push({
          candidateName: candidate.name,
          url: urlToTry,
          hasQuestionnaire: false,
          notes: 'Page exists but no questionnaire format',
        })
      }
    } catch (error) {
      console.error(`  ${EMOJI.ERROR} Error scraping:`, error)
      results.push({
        candidateName: candidate.name,
        url: urlToTry,
        hasQuestionnaire: false,
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    // Conservative rate limiting for Wix
    await page.waitForTimeout(RATE_LIMITS.WIX_LOADS)
  }

  await browser.close()

  // Output CSV
  console.log('\n\n=== RESULTS ===')
  const csvHeaders = 'Candidate Name,URL,Has Questionnaire,Questionnaire Text,Notes'
  console.log(csvHeaders)

  const csvLines = results.map(r =>
    [
      escapeCsvField(r.candidateName),
      escapeCsvField(r.url),
      r.hasQuestionnaire ? 'TRUE' : 'FALSE',
      escapeCsvField(r.questionnaireText || ''),
      escapeCsvField(r.notes || ''),
    ].join(',')
  )

  for (const line of csvLines) {
    console.log(line)
  }

  // Save to file
  const fs = await import('fs')
  const csv = [csvHeaders, ...csvLines].join('\n')
  const outputPath = 'scripts/import/wrcg-responses.csv'
  fs.writeFileSync(outputPath, csv)

  if (detailedResponses.length > 0) {
    const detailHeaders = 'Candidate Name,Question Order,Question,Answer,URL'
    const detailLines = detailedResponses
      .sort((a, b) =>
        a.candidateName === b.candidateName
          ? a.position - b.position
          : a.candidateName.localeCompare(b.candidateName)
      )
      .map(r =>
        [
          escapeCsvField(r.candidateName),
          String(r.position),
          escapeCsvField(r.question),
          escapeCsvField(r.answer),
          escapeCsvField(r.url),
        ].join(',')
      )

    const detailPath = 'scripts/import/wrcg-questionnaire-responses.csv'
    fs.writeFileSync(detailPath, [detailHeaders, ...detailLines].join('\n'))
    console.log(`${EMOJI.SUCCESS} Detailed responses saved to ${detailPath}`)
  } else {
    console.log(`${EMOJI.INFO} No detailed responses extracted`)
  }

  // Summary
  const withQuestionnaire = results.filter(r => r.hasQuestionnaire).length

  console.log(`\n${EMOJI.SUMMARY} Summary:`)
  console.log(`   Total processed: ${processed}`)
  console.log(`   With questionnaire: ${withQuestionnaire}`)
  console.log(`   Without questionnaire: ${processed - withQuestionnaire}`)
  console.log(`\n${EMOJI.SUCCESS} Results saved to ${outputPath}`)
  console.log(`${EMOJI.INFO} Review the CSV and then run: npm run import:wrcg:load`)

  await prisma.$disconnect()
}

scrapeWrcg().catch(console.error)
