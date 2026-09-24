/**
 * Points existing letter endorsements at the writer's own letter.
 *
 * Letters loaded before deep linking link to the top of a Herald batch page.
 * This opens each batch page once, finds each writer's letter, and rewrites
 * the endorsement URL with a text fragment for that letter's subheading (see
 * letter-deeplink.ts). Endorsements whose letter can't be found keep their URL.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json \
 *          scripts/import/deeplink-letter-endorsements.ts [--dry-run]
 */
import 'dotenv/config'
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { existsSync } from 'fs'
import { extractLetterSections, letterDeepLink } from './letter-deeplink'
import { CURRENT_ELECTION_YEAR } from '../../lib/constants'

const prisma = new PrismaClient()
const SESSION_PATH = 'scripts/import/herald-session.json'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const endorsements = await prisma.endorsement.findMany({
    // Past years are frozen static snapshots, so only the live guide's letters matter
    where: {
      type: 'LETTER',
      url: { contains: 'tri-cityherald.com' },
      candidate: { electionYear: CURRENT_ELECTION_YEAR },
    },
    select: { id: true, endorser: true, url: true, candidate: { select: { name: true } } },
  })

  const byPage = new Map<string, typeof endorsements>()
  for (const e of endorsements) {
    const base = e.url!.split('#')[0].trim()
    byPage.set(base, [...(byPage.get(base) ?? []), e])
  }
  console.log(`${endorsements.length} letter endorsements across ${byPage.size} Herald pages`)

  // The Herald blocks headless browsers; the window is parked off-screen
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--window-position=-3000,-3000'],
  })
  const context = await browser.newContext(existsSync(SESSION_PATH) ? { storageState: SESSION_PATH } : {})
  const page = await context.newPage()

  let updated = 0
  let unchanged = 0
  const notFound: string[] = []

  for (const [base, group] of byPage) {
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(2500)
    const sections = await extractLetterSections(page)

    for (const e of group) {
      const link = letterDeepLink(base, sections, e.endorser)
      if (link === base) notFound.push(`${e.endorser} (${base.match(/article\d+/)?.[0]})`)
      if (link === e.url) {
        unchanged++
        continue
      }
      console.log(`  ${e.endorser} -> ${decodeURIComponent(link.split('#:~:text=')[1] ?? '(page top)')}`)
      if (!dryRun) await prisma.endorsement.update({ where: { id: e.id }, data: { url: link } })
      updated++
    }
    await page.waitForTimeout(1000)
  }

  await browser.close()
  console.log(
    `\n${dryRun ? '[dry run] ' : ''}updated=${updated} unchanged=${unchanged} letter not found=${notFound.length}` +
      (notFound.length ? `: ${notFound.join(', ')}` : '')
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
