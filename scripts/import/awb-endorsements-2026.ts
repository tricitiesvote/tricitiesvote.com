/**
 * AWB 2026 Legislative Endorsements
 *
 * Ingests the Association of Washington Business 2026 candidate endorsements
 * as ORG-type Endorsement records (FOR), sourced to the published article.
 * Idempotent: skips candidates that already have an AWB endorsement.
 *
 * Source: https://www.tricitiesbusinessnews.com/articles/awb-releases-2026-legislative-endorsements
 */
import { PrismaClient, EndorsementType, ForAgainst } from '@prisma/client'

const prisma = new PrismaClient()

// Displayed name is kept tight to match the endorsement interface (endorser is
// shown verbatim, so no publication/article tail).
const ENDORSER = 'Assoc of WA Business'
const SOURCE_URL =
  'https://www.tricitiesbusinessnews.com/articles/awb-releases-2026-legislative-endorsements'

// DB name spellings for the nine AWB-endorsed 2026 candidates.
const ENDORSED_NAMES = [
  'Stephanie Barnard',
  'April Connors',
  'Gloria Mendoza',
  'Deb Manjarrez',
  'Chris Corry',
  'Mark Klicker',
  'Skyler Rude',
  'Nikki Torres',
  'Jeremie Dufault',
]

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  let created = 0
  let skipped = 0
  const unmatched: string[] = []

  for (const name of ENDORSED_NAMES) {
    const candidate = await prisma.candidate.findFirst({
      where: { electionYear: 2026, name: { equals: name, mode: 'insensitive' } },
      select: { id: true, name: true },
    })

    if (!candidate) {
      unmatched.push(name)
      console.log(`  ? no 2026 candidate matched "${name}"`)
      continue
    }

    const existing = await prisma.endorsement.findFirst({
      where: { candidateId: candidate.id, endorser: ENDORSER },
    })
    if (existing) {
      skipped++
      console.log(`  = already has AWB endorsement: ${candidate.name}`)
      continue
    }

    if (dryRun) {
      console.log(`  + would endorse: ${candidate.name}`)
      created++
      continue
    }

    await prisma.endorsement.create({
      data: {
        candidateId: candidate.id,
        endorser: ENDORSER,
        url: SOURCE_URL,
        type: EndorsementType.ORG,
        forAgainst: ForAgainst.FOR,
      },
    })
    created++
    console.log(`  + endorsed: ${candidate.name}`)
  }

  console.log(
    `\n${dryRun ? '[dry run] ' : ''}created=${created} skipped=${skipped} unmatched=${unmatched.length}` +
      (unmatched.length ? ` (${unmatched.join(', ')})` : '')
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
