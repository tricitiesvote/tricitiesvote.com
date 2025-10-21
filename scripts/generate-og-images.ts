import { spawn } from 'node:child_process'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { chromium } from 'playwright'
import { prisma } from '@/lib/db'
import { getAvailableYears, getGuidesForYear } from '@/lib/queries'
import { slugify } from '@/lib/utils'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const SERVER_PORT = Number.parseInt(process.env.OG_SERVER_PORT ?? '3110', 10)
const SERVER_ORIGIN = `http://127.0.0.1:${SERVER_PORT}`

interface Target {
  url: string
  imagePath: string
  label: string
}

async function waitForServer(origin: string) {
  const maxAttempts = 60
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(origin, { method: 'HEAD' })
      if (response.ok || response.status === 404) {
        return
      }
    } catch {
      // swallow until ready
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error('Next.js server did not become ready in time')
}

function startServer() {
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', String(SERVER_PORT)], {
    stdio: 'inherit'
  })
  return server
}

async function collectTargets(): Promise<Target[]> {
  let years: number[]

  try {
    years = await getAvailableYears()
  } catch (error) {
    throw new Error(
      `Failed to fetch available years. Ensure the database defined by DATABASE_URL is reachable before running generate:og.\nOriginal error: ${(error as Error).message}`
    )
  }
  const targets: Target[] = []

  for (const year of years) {
    let guides

    try {
      guides = await getGuidesForYear(year)
    } catch (error) {
      throw new Error(
        `Failed to fetch guides for ${year}. Confirm your database is online and credentials are valid.\nOriginal error: ${(error as Error).message}`
      )
    }

    targets.push({
      url: `/og/${year}`,
      imagePath: `og/${year}/year.png`,
      label: `${year} year`
    })

    const guideSlugPairs = guides.map(guide => ({
      slug: slugify(guide.region.name),
      label: guide.region.name,
      races: guide.Race
    }))

    for (const entry of guideSlugPairs) {
      targets.push({
        url: `/og/${year}/guide/${entry.slug}`,
        imagePath: `og/${year}/guide/${entry.slug}.png`,
        label: `${year} ${entry.label} guide`
      })
    }

    const raceSlugs = new Set<string>()
    const candidateSlugs = new Set<string>()

    for (const entry of guideSlugPairs) {
      for (const race of entry.races) {
        const raceSlug = slugify(race.office.title)
        if (!raceSlugs.has(raceSlug)) {
          raceSlugs.add(raceSlug)
          targets.push({
            url: `/og/${year}/race/${raceSlug}`,
            imagePath: `og/${year}/race/${raceSlug}.png`,
            label: `${year} ${race.office.title} race`
          })
        }

        for (const { candidate } of race.candidates) {
          const candidateSlug = slugify(candidate.name)
          if (!candidateSlugs.has(candidateSlug)) {
            candidateSlugs.add(candidateSlug)
            targets.push({
              url: `/og/${year}/candidate/${candidateSlug}`,
              imagePath: `og/${year}/candidate/${candidateSlug}.png`,
              label: `${year} ${candidate.name} candidate`
            })
          }
        }
      }
    }
  }

  return targets
}

async function ensureDirectory(relativePath: string) {
  const directory = path.dirname(path.join('public', relativePath))
  await fs.mkdir(directory, { recursive: true })
}

async function captureTargets(targets: Target[]) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: OG_WIDTH, height: OG_HEIGHT },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  const failures: Target[] = []

  for (const target of targets) {
    const destination = path.join('public', target.imagePath)
    await ensureDirectory(target.imagePath)

    try {
      await page.goto(`${SERVER_ORIGIN}${target.url}`, {
        waitUntil: 'networkidle'
      })
      await page.waitForTimeout(400)
      await page.screenshot({
        path: destination,
        clip: { x: 0, y: 0, width: OG_WIDTH, height: OG_HEIGHT }
      })
      console.log(`✓ Captured ${target.label}`)
    } catch (error) {
      failures.push(target)
      console.warn(`✗ Failed to capture ${target.label}: ${(error as Error).message}`)
    }
  }

  await browser.close()

  if (failures.length > 0) {
    const summary = failures.map(item => ` - ${item.url}`).join('\n')
    throw new Error(`Capture completed with ${failures.length} failure(s):\n${summary}`)
  }
}

async function main() {
  const server = startServer()

  try {
    await waitForServer(SERVER_ORIGIN)
    const targets = await collectTargets()
    if (targets.length === 0) {
      console.warn('No targets detected. Did you import election data?')
      return
    }
    await captureTargets(targets)
  } finally {
    server.kill('SIGTERM')
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
