/**
 * 2026 endorsements submitted directly by campaigns.
 *
 * Campaigns send their endorsement rosters in by email. There is no source URL
 * to link, so these records carry only the endorser's name as the campaign
 * wrote it. Organizations are ORG; named individuals are SOCIAL, matching how
 * individual endorsers are already stored.
 *
 * Idempotent: an endorser already recorded for a candidate is left alone.
 *
 * Usage: npx ts-node --project tsconfig.scripts.json \
 *          scripts/import/submitted-endorsements-2026.ts [--dry-run]
 */
import { PrismaClient, EndorsementType, ForAgainst } from '@prisma/client'

const prisma = new PrismaClient()

const ELECTION_YEAR = 2026

type Submission = {
  candidate: string
  orgs?: string[]
  people?: string[]
}

const SUBMISSIONS: Submission[] = [
  {
    candidate: 'Kyle Palmer',
    orgs: [
      "Nat'l Democratic Redistricting Committee",
      'Franklin County Democrats',
      'Walla Walla County Democrats',
      'Washington State Stonewall Democrats',
      'La Voz',
      'Planned Parenthood Advocates of Greater WA+',
    ],
  },
  {
    candidate: 'Brad Klippert',
    orgs: ['Stand For Health Freedom'],
    people: [
      'Rtd Benton County Sheriff Tom Croskrey',
      'Pasco City Councilmember Joe Cotta',
      'Mikaela Strech',
      'Joe Lloyd',
      'Todd Carlson',
      'Julie Barrett',
      'Diane McCants',
    ],
  },
  {
    candidate: 'Chris Hollingsworth',
    orgs: [
      'Tri Cities Association of Realtors',
      'Washington Farm Bureau PAC',
      'Mainstream Republicans of Washington',
      'Washington Patriot PAC',
    ],
    people: [
      'State Senator Perry Dozier',
      'State Rep April Connors',
      'Rtd Pasco City Mgr Gary Crutchfield',
      'Rtd Pasco Fire Chief Bob Gear',
    ],
  },
]

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  let created = 0
  let skipped = 0
  const unmatched: string[] = []

  for (const submission of SUBMISSIONS) {
    const candidate = await prisma.candidate.findFirst({
      where: {
        electionYear: ELECTION_YEAR,
        name: { equals: submission.candidate, mode: 'insensitive' },
      },
      select: { id: true, name: true },
    })

    if (!candidate) {
      unmatched.push(submission.candidate)
      console.log(`  ? no ${ELECTION_YEAR} candidate matched "${submission.candidate}"`)
      continue
    }

    console.log(`\n${candidate.name}`)

    const entries: Array<{ endorser: string; type: EndorsementType }> = [
      ...(submission.orgs ?? []).map(endorser => ({ endorser, type: EndorsementType.ORG })),
      ...(submission.people ?? []).map(endorser => ({ endorser, type: EndorsementType.SOCIAL })),
    ]

    for (const entry of entries) {
      const existing = await prisma.endorsement.findFirst({
        where: { candidateId: candidate.id, endorser: entry.endorser },
      })
      if (existing) {
        skipped++
        console.log(`  = already recorded: ${entry.endorser}`)
        continue
      }

      if (!dryRun) {
        await prisma.endorsement.create({
          data: {
            candidateId: candidate.id,
            endorser: entry.endorser,
            type: entry.type,
            forAgainst: ForAgainst.FOR,
          },
        })
      }
      created++
      console.log(`  + ${dryRun ? 'would add' : 'added'}: ${entry.endorser}`)
    }
  }

  console.log(
    `\n${dryRun ? '[dry run] ' : ''}created=${created} skipped=${skipped} unmatched=${unmatched.length}` +
      (unmatched.length ? `: ${unmatched.join(', ')}` : '')
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
