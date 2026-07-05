import { chromium, Browser, Page } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { CURRENT_ELECTION_YEAR } from '../../lib/constants'

const prisma = new PrismaClient()

const yearArg = process.argv.slice(2).find(arg => arg.startsWith('--year='))
const parsedYear = yearArg ? parseInt(yearArg.split('=')[1], 10) : NaN
const ELECTION_YEAR = Number.isNaN(parsedYear) ? CURRENT_ELECTION_YEAR : parsedYear

interface PDCResult {
  candidateName: string
  pdcUrl: string | null
  isMiniFiler: boolean
  region: string | null
  error?: string
}

/**
 * Remove diacritics from text for searching (José → Jose, María → Maria)
 */
function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

async function processCandidate(candidate: any, regionName: string, page: Page): Promise<PDCResult> {
  // Search using ASCII version of name (without diacritics) since PDC may not index with accents
  const searchName = removeDiacritics(candidate.name)

  try {
    // Navigate to PDC search page
    await page.goto('https://www.pdc.wa.gov/political-disclosure-reporting-data/browse-search-data/candidates', {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    await page.waitForTimeout(3000)

    // Use the YADCF column filter for candidate names
    const candidateFilter = page.locator('#yadcf-filter--candidates-table-0')
    await candidateFilter.waitFor({ state: 'visible', timeout: 10000 })
    await candidateFilter.clear()
    await candidateFilter.fill(searchName)

    // Wait for table to filter
    await page.waitForTimeout(2000)

    // Look for candidate links with year information
    const candidateLinks = await page.$$eval(
      'table tbody tr',
      (rows) => {
        return rows
          .map(row => {
            const link = row.querySelector('a[href*="/candidates/"]') as HTMLAnchorElement
            const yearCell = row.querySelectorAll('td')[1] // Second column is election year
            const year = yearCell?.textContent?.trim()

            if (!link) return null

            return {
              href: link.href,
              text: link.textContent?.trim() || '',
              year: parseInt(year || '0')
            }
          })
          .filter((item): item is { href: string; text: string; year: number } => item !== null)
      }
    )

    if (candidateLinks.length === 0) {
      console.log(`  ⚠️  No PDC profile found for ${candidate.name}`)
      return {
        candidateName: candidate.name,
        pdcUrl: null,
        isMiniFiler: false,
        region: regionName,
        error: 'No PDC profile found'
      }
    }

    // Prefer entries for the target election year
    let bestMatch = candidateLinks.find(link => link.year === ELECTION_YEAR) || candidateLinks[0]

    if (candidateLinks.length > 1) {
      console.log(`  ℹ️  Found ${candidateLinks.length} entries (using ${bestMatch.year})`)
    }

    // Visit the candidate's PDC page
    await page.goto(bestMatch.href, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })
    await page.waitForTimeout(2000)

    // Verify region - check that the jurisdiction/office matches our expected region
    const pageText = await page.textContent('body')

    // Build more specific region checks - look for jurisdiction context
    const jurisdictionKeywords = [
      `CITY OF ${regionName.toUpperCase()}`,
      `${regionName.toUpperCase()} CITY`,
      `${regionName.toUpperCase()} SCHOOL`,
      `PORT OF ${regionName.toUpperCase()}`,
      `${regionName.toUpperCase()} COUNTY`,
      // Specific city names for our Tri-Cities region
      'CITY OF PASCO',
      'CITY OF KENNEWICK',
      'CITY OF RICHLAND',
      'CITY OF WEST RICHLAND',
      'PASCO SCHOOL',
      'KENNEWICK SCHOOL',
      'RICHLAND SCHOOL',
      'PORT OF BENTON',
      'PORT OF KENNEWICK',
      'PORT OF PASCO',
      'BENTON COUNTY',
      'FRANKLIN COUNTY'
    ]

    const regionMatch = jurisdictionKeywords.some(keyword =>
      pageText?.toUpperCase().includes(keyword)
    )

    if (!regionMatch) {
      console.log(`  ⚠️  Region mismatch - expected ${regionName} jurisdiction, page appears to be for a different area`)
      return {
        candidateName: candidate.name,
        pdcUrl: null,
        isMiniFiler: false,
        region: regionName,
        error: `Region mismatch - found PDC profile but not for ${regionName}`
      }
    }

    // Check if they're a mini filer
    // Look for specific indicators that they filed as a mini-filer, not just the word "mini"
    const isMiniFiler = (
      pageText?.toLowerCase().includes('filed as a mini') ||
      pageText?.toLowerCase().includes('mini-filer candidate') ||
      pageText?.toLowerCase().includes('minifiler candidate') ||
      pageText?.toLowerCase().includes('campaign status: mini') ||
      // Check for the specific PDC table cell or heading that indicates mini-filer status
      (pageText?.toLowerCase().includes('filer type') && pageText?.toLowerCase().includes('mini'))
    ) || false

    const pdcUrl = page.url()

    console.log(`  ✅ PDC URL: ${pdcUrl}`)
    console.log(`  📊 Mini Filer: ${isMiniFiler ? 'Yes' : 'No'}`)

    // Update database
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        pdc: pdcUrl,
        minifiler: isMiniFiler
      }
    })

    return {
      candidateName: candidate.name,
      pdcUrl: pdcUrl,
      isMiniFiler: isMiniFiler,
      region: regionName
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${candidate.name}:`, error)
    return {
      candidateName: candidate.name,
      pdcUrl: null,
      isMiniFiler: false,
      region: regionName,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function processSingleBrowser(candidates: any[], headless: boolean) {
  const results: PDCResult[] = []

  // Launch browser
  const browser = await chromium.launch({
    headless: headless,
    args: ['--disable-blink-features=AutomationControlled']
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles'
  })

  const page = await context.newPage()

  // Process each candidate
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const regionName = candidate.office.region.name

    console.log(`\n[${i + 1}/${candidates.length}] Processing: ${candidate.name} (${regionName})`)

    const result = await processCandidate(candidate, regionName, page)
    results.push(result)

    // Be respectful - wait between requests
    await page.waitForTimeout(2000)
  }

  await browser.close()

  printSummary(results, candidates.length)
}

async function processInParallel(candidates: any[], parallelCount: number, headless: boolean) {
  const results: PDCResult[] = []

  // Split candidates into chunks
  const chunks: any[][] = []
  const chunkSize = Math.ceil(candidates.length / parallelCount)

  for (let i = 0; i < candidates.length; i += chunkSize) {
    chunks.push(candidates.slice(i, i + chunkSize))
  }

  console.log(`Split ${candidates.length} candidates into ${chunks.length} chunks\n`)

  // Process chunks in parallel
  const promises = chunks.map(async (chunk, chunkIndex) => {
    // Launch separate browser for this chunk
    const browser = await chromium.launch({
      headless: headless,
      args: ['--disable-blink-features=AutomationControlled']
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles'
    })

    const page = await context.newPage()
    const chunkResults: PDCResult[] = []

    for (let i = 0; i < chunk.length; i++) {
      const candidate = chunk[i]
      const regionName = candidate.office.region.name

      console.log(`[Browser ${chunkIndex + 1}] [${i + 1}/${chunk.length}] Processing: ${candidate.name} (${regionName})`)

      const result = await processCandidate(candidate, regionName, page)
      chunkResults.push(result)

      // Be respectful - wait between requests
      await page.waitForTimeout(2000)
    }

    await browser.close()
    return chunkResults
  })

  const allResults = await Promise.all(promises)
  allResults.forEach(chunkResults => results.push(...chunkResults))

  printSummary(results, candidates.length)
}

function printSummary(results: PDCResult[], totalCandidates: number) {
  console.log('\n\n=== Summary ===')
  console.log(`Total candidates: ${totalCandidates}`)
  console.log(`Successfully found: ${results.filter(r => r.pdcUrl).length}`)
  console.log(`Mini filers: ${results.filter(r => r.isMiniFiler).length}`)
  console.log(`Not found: ${results.filter(r => !r.pdcUrl).length}`)

  if (results.filter(r => r.error).length > 0) {
    console.log('\nErrors:')
    results.filter(r => r.error).forEach(r => {
      console.log(`  - ${r.candidateName}: ${r.error}`)
    })
  }
}

async function scrapePDC() {
  console.log('🔍 Starting PDC candidate scraper...\n')

  const args = process.argv.slice(2)
  const testMode = args.includes('--test')
  const headless = args.includes('--headless')
  const parallelCount = parseInt(args.find(arg => arg.startsWith('--parallel='))?.split('=')[1] || '1')

  if (headless) {
    console.log('🤖 Running in headless mode')
  }
  if (parallelCount > 1) {
    console.log(`⚡ Running ${parallelCount} browsers in parallel`)
  }

  // Fetch candidates for the target election year from database
  console.log(`📊 Fetching ${ELECTION_YEAR} candidates from database...`)
  let candidates = await prisma.candidate.findMany({
    where: {
      electionYear: ELECTION_YEAR
    },
    include: {
      office: {
        include: {
          region: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  if (testMode) {
    console.log('🧪 TEST MODE: Processing only first 3 candidates')
    candidates = candidates.slice(0, 3)
  }

  console.log(`✅ Found ${candidates.length} candidates to process\n`)

  if (parallelCount > 1) {
    // Process in parallel
    await processInParallel(candidates, parallelCount, headless)
  } else {
    // Process sequentially with single browser
    await processSingleBrowser(candidates, headless)
  }

  await prisma.$disconnect()
}

if (require.main === module) {
  scrapePDC().catch(console.error)
}
