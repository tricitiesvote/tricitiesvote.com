import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Endorsement {
  candidateName: string
  letterWriter: string
  position: 'FOR' | 'AGAINST' | 'REVIEW' | 'IGNORE'
  officeType: string
  url: string
  excerpt?: string
}

const OFFICE_LABELS: Record<string, string> = {
  CITY_COUNCIL: 'City Council',
  SCHOOL_BOARD: 'School Board',
  PORT_COMMISSIONER: 'Port Commissioner',
  BALLOT_MEASURE: 'Ballot Measure'
}

const args = process.argv.slice(2)
const forceFullRescan = args.includes('--full')
const sinceArg = args.find(arg => arg.startsWith('--since='))
const parsedSince = sinceArg ? new Date(sinceArg.split('=')[1]) : null
const sinceIsValid = parsedSince instanceof Date && !Number.isNaN(parsedSince?.getTime?.() ?? Number.NaN)

async function scrapeLetters() {
  console.log('🔍 Starting Tri-City Herald Letters scraper...\n')

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY environment variable not set')
    console.error('Please add it to your .env file or set it in your environment')
    process.exit(1)
  }

  // Fetch candidates from database
  console.log('📊 Fetching candidates from database...')
  const candidates = await prisma.candidate.findMany({
    where: {
      electionYear: 2025,
      office: {
        type: {
          in: ['CITY_COUNCIL', 'SCHOOL_BOARD', 'PORT_COMMISSIONER', 'BALLOT_MEASURE']
        }
      }
    },
    include: {
      office: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  const candidateNames = candidates.map(c => c.name)
  const candidateOfficeMap = new Map(
    candidates.map(c => [c.name, OFFICE_LABELS[c.office.type] ?? c.office.type])
  )

  console.log(`✅ Found ${candidateNames.length} candidates in 2025 races\n`)

  // Find the most recent letter we've already processed
  console.log('🔍 Checking for previously processed letters...')
  const lastLetter = await prisma.endorsement.findFirst({
    where: {
      type: 'LETTER',
      url: {
        contains: 'tri-cityherald.com'
      }
    },
    orderBy: {
      url: 'desc' // Article numbers increase over time, so sort by URL desc
    },
    select: {
      url: true
    }
  })

  let cutoffDate = sinceIsValid ? parsedSince! : new Date('2025-05-01') // Default fallback
  let cutoffMessage = sinceIsValid
    ? parsedSince!.toLocaleDateString()
    : 'May 2025 (default)'

  const lastLetterUrl = lastLetter?.url ?? null

  if (forceFullRescan) {
    console.log('ℹ️  --full flag detected; scanning all available letters')
    if (!sinceIsValid) {
      cutoffDate = new Date('2000-01-01')
      cutoffMessage = cutoffDate.toLocaleDateString()
    }
  }

  if (sinceIsValid) {
    console.log(`ℹ️  Using custom cutoff: ${cutoffMessage}`)
  }

  if (lastLetterUrl && !forceFullRescan) {
    // Extract article number from URL
    const match = lastLetterUrl.match(/article(\d+)\.html/)
    if (match) {
      const lastArticleNum = parseInt(match[1])
      console.log(`✅ Last processed article: ${lastArticleNum} (${lastLetterUrl})`)
      cutoffMessage = `article ${lastArticleNum}`
      // We'll check article numbers instead of dates for already-processed letters
    }
  } else {
    console.log(`ℹ️  No previous letters found, starting from ${cutoffDate.toLocaleDateString()}`)
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  // Launch browser with realistic settings to avoid blocking
  const browser = await chromium.launch({
    headless: false, // Some sites block headless
    args: ['--disable-blink-features=AutomationControlled']
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles'
  })

  const page = await context.newPage()

  // Navigate to letters index and collect links from multiple pages
  console.log('📄 Fetching letters index page...')
  const allLetterLinks: string[] = []

  // Extract the last processed article number to use as cutoff
  let lastProcessedArticleNum = 0
  if (lastLetterUrl && !forceFullRescan) {
    const match = lastLetterUrl.match(/article(\d+)\.html/)
    if (match) {
      lastProcessedArticleNum = parseInt(match[1])
    }
  }

  let currentPage = 1
  const maxPages = 10 // Will stop early when we hit already-processed articles
  let stopScraping = false

  while (currentPage <= maxPages && !stopScraping) {
    const pageUrl = currentPage === 1
      ? 'https://www.tri-cityherald.com/opinion/letters-to-the-editor/'
      : `https://www.tri-cityherald.com/opinion/letters-to-the-editor/#storylink=readmore_inline&page=${currentPage}`

    console.log(`  Page ${currentPage}...`)
    await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    // Wait a bit for dynamic content
    await page.waitForTimeout(3000)

    // Extract letter article links and dates from this page
    const pageData = await page.$$eval('article',
      articles => articles.map(article => {
        const link = article.querySelector('a[href*="/opinion/letters-to-the-editor/article"]') as HTMLAnchorElement
        const dateElement = article.querySelector('time') || article.querySelector('[class*="date"]')
        const dateText = dateElement?.textContent || ''

        return {
          url: link?.href || '',
          dateText: dateText.trim()
        }
      }).filter(item => item.url)
    )

    if (pageData.length === 0) {
      console.log(`  No more articles found, stopping at page ${currentPage}`)
      break
    }

    // Check article numbers and stop if we've hit already-processed letters
    for (const item of pageData) {
      // Extract article number from URL
      const articleMatch = item.url.match(/article(\d+)\.html/)
      if (articleMatch) {
        const articleNum = parseInt(articleMatch[1])

        // If we have a last processed article and this article is older, stop
        if (lastProcessedArticleNum > 0 && articleNum <= lastProcessedArticleNum) {
          console.log(`  Found article ${articleNum}, already processed (last processed: ${lastProcessedArticleNum}) - stopping`)
          stopScraping = true
          break
        }
      }

      // Fallback: also check dates if article number matching doesn't work
      if (!lastProcessedArticleNum) {
        let articleDate: Date | null = null
        const dateMatch = item.dateText.match(/([A-Z][a-z]+)\s+(\d+),\s+(\d{4})/)
        if (dateMatch) {
          articleDate = new Date(`${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`)
        }

        if (articleDate && articleDate < cutoffDate) {
          console.log(`  Found article from ${item.dateText}, before May 2025 cutoff - stopping`)
          stopScraping = true
          break
        }
      }

      allLetterLinks.push(item.url)
    }

    console.log(`  Found ${pageData.length} articles on page ${currentPage}`)

    currentPage++
    await page.waitForTimeout(2000) // Be respectful between page loads
  }

  // Deduplicate - remove anchor fragments (#storylink=...) before deduping
  const cleanedLinks = allLetterLinks.map(url => url.split('#')[0])
  const uniqueLinks = Array.from(new Set(cleanedLinks))

  const sinceMessage = lastProcessedArticleNum > 0
    ? `since article ${lastProcessedArticleNum}`
    : 'since May 2025'
  console.log(`✅ Found ${uniqueLinks.length} unique letter articles (${sinceMessage}) across ${currentPage - 1} pages\n`)

  const endorsements: Endorsement[] = []

  // Process each letter
  for (const url of uniqueLinks) {
    console.log(`\n📖 Processing: ${url}`)

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })
      await page.waitForTimeout(2000)

      // Extract article text content
      const articleText = await page.evaluate(() => {
        const article = document.querySelector('article')
        if (!article) return ''

        // Get all headings and paragraphs
        const elements = article.querySelectorAll('h2, p')
        return Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .join('\n\n')
      })

      if (!articleText) {
        console.log('  ⚠️  No text content found, skipping')
        continue
      }

      // Analyze with Claude
      console.log('  🤖 Analyzing with AI...')
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are analyzing letters to the editor for mentions of local election candidates.

Candidate list (2025 Tri-Cities races):
${candidateNames.join(', ')}

Ballot measure context:
- The Richland Charter Amendment (ballot measure) is represented by two committees: "Yes to Districts" (support) and "No to Districts" (oppose).
- If a letter clearly supports creating council districts in Richland, return the candidateName "Yes to Districts" even if that exact phrase is not present.
- If a letter clearly opposes the charter amendment, return the candidateName "No to Districts" even if that exact phrase is not present.
- Set officeType to "Ballot Measure" for these measure-related results.

Task: Read the following letter(s) to the editor and identify any mentions of these candidates. Categorize each mention:

**CRITICAL MATCHING RULES**:
- The candidate's FULL NAME must appear in the letter text exactly as listed (except for the Richland Charter Amendment rule above)
- Do NOT match partial names (e.g., "Brad Beauchamp" ≠ "Brad Klippert")
- Do NOT match first names only unless the last name also appears
- Do NOT make assumptions about who is being referenced
- When in doubt, use IGNORE rather than guessing

**FOR**: The letter is clearly positive/supportive of the candidate. This includes:
- Explicit endorsements ("I support X", "Vote for X")
- Positive descriptions of the candidate's work, character, or positions
- Defense of the candidate against criticism

**AGAINST**: The letter is clearly negative/critical of the candidate. This includes:
- Explicit opposition ("Don't vote for X", "X should resign")
- Criticism of the candidate's actions, positions, or character
- Calls for recall or removal

**REVIEW**: The letter mentions the candidate but it's unclear if it's positive or negative. This includes:
- Neutral mentions (candidate's name in passing)
- Mixed messages (both positive and negative)
- Factual statements without clear sentiment
- Ambiguous context

**IGNORE**: Do not include in results. Use for:
- No mention of any candidates
- Names that are similar but don't match exactly (e.g., wrong person with same first name)
- Mentions that are clearly unrelated to the election (e.g., historical references)

For each FOR, AGAINST, or REVIEW mention found, return a JSON array with objects containing:
- candidateName: (must match the list above EXACTLY - full name required)
- letterWriter: (person who wrote the letter, found at the end of each section)
- position: ("FOR", "AGAINST", or "REVIEW")
- officeType: ("City Council", "School Board", "Port Commissioner", or "Ballot Measure")
- excerpt: (brief quote showing the relevant mention WITH THE FULL NAME, max 100 chars)

Return ONLY valid JSON array. If nothing found (all IGNORE), return: []

Letters text:
${articleText}`
        }]
      })

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : ''

      // Parse JSON response - extract JSON from markdown code blocks if present
      try {
        let jsonText = responseText.trim()

        // Try to extract JSON from markdown code blocks
        const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1]
        } else {
          // Try to find raw JSON array
          const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
          if (arrayMatch) {
            jsonText = arrayMatch[1]
          }
        }

        const parsed = JSON.parse(jsonText)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate by creating a unique key
          const seen = new Set<string>()
          for (const endorsement of parsed) {
            const key = `${endorsement.candidateName}|${endorsement.letterWriter}|${endorsement.position}`
            if (!seen.has(key)) {
              seen.add(key)
              const normalizedCandidateName = typeof endorsement.candidateName === 'string'
                ? endorsement.candidateName.trim()
                : endorsement.candidateName
              const officeTypeLabel = normalizedCandidateName
                ? candidateOfficeMap.get(normalizedCandidateName) ?? endorsement.officeType
                : endorsement.officeType
              endorsements.push({
                ...endorsement,
                candidateName: normalizedCandidateName,
                officeType: officeTypeLabel,
                url
              })
              console.log(`  ✅ Found: ${endorsement.position} ${normalizedCandidateName} by ${endorsement.letterWriter}`)
            }
          }
        } else {
          console.log('  ℹ️  No relevant endorsements found')
        }
      } catch (e) {
        console.log(`  ⚠️  Failed to parse AI response`)
        console.log(`  Raw response: ${responseText.substring(0, 200)}...`)
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`  ❌ Error processing ${url}:`, error)
    }
  }

  await browser.close()
  await prisma.$disconnect()

  // Output CSV
  console.log('\n\n=== RESULTS ===')
  console.log('Candidate Name,Letter Writer,Position,Office Type,Excerpt,URL')
  for (const e of endorsements) {
    console.log([
      escapeCsv(e.candidateName ?? ''),
      escapeCsv(e.letterWriter ?? ''),
      escapeCsv(e.position),
      escapeCsv(e.officeType),
      escapeCsv(e.excerpt ?? ''),
      escapeCsv(e.url)
    ].join(','))
  }

  // Group by position
  const forCount = endorsements.filter(e => e.position === 'FOR').length
  const againstCount = endorsements.filter(e => e.position === 'AGAINST').length
  const reviewCount = endorsements.filter(e => e.position === 'REVIEW').length

  console.log(`\n📊 Summary:`)
  console.log(`   FOR: ${forCount}`)
  console.log(`   AGAINST: ${againstCount}`)
  console.log(`   REVIEW (needs human review): ${reviewCount}`)

  // Save to file
  const csv = [
    'Candidate Name,Letter Writer,Position,Office Type,Excerpt,URL',
    ...endorsements.map(e => {
    return [
      escapeCsv(e.candidateName ?? ''),
      escapeCsv(e.letterWriter ?? ''),
      escapeCsv(e.position),
      escapeCsv(e.officeType),
      escapeCsv(e.excerpt ?? ''),
      escapeCsv(e.url)
    ].join(',')
  })
].join('\n')

  const fs = await import('fs')
  const outputPath = 'scripts/import/letter-endorsements.csv'
  fs.writeFileSync(outputPath, csv)

  // Also save a separate file for items needing review
  const reviewItems = endorsements.filter(e => e.position === 'REVIEW')
  if (reviewItems.length > 0) {
    const reviewCsv = [
      'Candidate Name,Letter Writer,Position,Office Type,Excerpt,URL',
      ...reviewItems.map(e => {
        return [
          escapeCsv(e.candidateName ?? ''),
          escapeCsv(e.letterWriter ?? ''),
          escapeCsv(e.position),
          escapeCsv(e.officeType),
          escapeCsv(e.excerpt ?? ''),
          escapeCsv(e.url)
        ].join(',')
      })
    ].join('\n')
    fs.writeFileSync('scripts/import/letter-endorsements-review.csv', reviewCsv)
    console.log(`\n⚠️  Items needing review saved to scripts/import/letter-endorsements-review.csv`)
  }

  console.log(`\n✅ All results saved to ${outputPath}`)
  console.log(`📊 Total mentions found: ${endorsements.length}`)
}

function escapeCsv(value: string | null | undefined) {
  const normalized = value ?? ''
  const needsQuotes = /[",\n]/.test(normalized)
  const sanitized = normalized.replace(/"/g, '""')
  return needsQuotes ? `"${sanitized}"` : sanitized
}

scrapeLetters().catch(console.error)
